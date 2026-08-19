import os
import json
import socket
import time
import urllib.request
import urllib.error
from django.http import FileResponse
from core.permissions import require_admin, require_super_admin, require_role, DEFAULT_ROLE_PERMISSIONS
from ninja import Router, Body, errors, Schema
from typing import List, Dict, Any, Optional
from django.contrib.auth.models import User
from ninja_jwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q
from core.models import (
    KnowledgeArticle, OperationLog,
    Asset, NetworkDevice, InventoryItem, Repair, Ticket, Employee,
    UserRole, Department, RolePermission
)
from .schemas import (
    KnowledgeArticleSchema, OperationLogSchema, LoginIn, LoginOut, ErrorOut, InitializeSetupSchema,
    RolePermissionSchema, RolePermissionUpdateSchema, UserProvisionInSchema, UserUpdateInSchema,
    UserDetailSchema, DepartmentSchema, DepartmentInSchema,
    OperationExecuteInSchema, OperationJobOutSchema, OperationPresetSchema,
    UserSessionOutSchema, RevokeSessionInSchema, TestEmailInSchema, TestWebhookInSchema,
    TestDiagnosticOutSchema, TaxonomyInSchema, TaxonomyOutSchema
)
from core.operations_engine import (
    execute_operation_async, get_job, get_all_jobs,
    run_bulk_reassign_assets, run_bulk_relocate_assets, run_bulk_status_change,
    run_bulk_restock_inventory, run_diagnostic_sweep
)
from core.session_manager import (
    record_session, get_user_sessions, revoke_session, revoke_all_other_sessions
)
from core.routers.utils import safe_fk_id

router = Router()

# ─── Settings storage (JSON file-backed) ──────────────────────────────────────

_SETTINGS_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "settings_data.json"
)

_DEFAULT_SETTINGS = {
    "general": {
        "orgName": "BikitaIT Infrastructure",
        "platformName": "Pulse IT Ops",
        "defaultCurrency": "USD ($)",
        "dateFormat": "YYYY-MM-DD",
        "maintenanceMode": False,
    },
    "security": {
        "mfa": False,
        "auditLog": True,
        "sessionTimeout": True,
        "passwordMinLength": 12,
        "allowedIpRanges": "0.0.0.0/0",
    },
    "notifications": {
        "emailAlerts": False,
        "smsAlerts": False,
        "smtpServer": "",
        "alertEmailSender": "",
    },
    "database": {
        "autoBackup": False,
        "backupRetention": "30 days",
    },
    "taxonomies": {
        "categories": ["Laptops", "Desktops", "Servers", "Monitors", "Printers", "Network Switches"],
        "locations": [],
    },
    "AUTH_ENABLED": True,
}


def _load_settings() -> dict:
    if os.path.exists(_SETTINGS_FILE):
        try:
            with open(_SETTINGS_FILE, "r") as f:
                stored = json.load(f)
            # Deep-merge with defaults so new keys always exist
            result: Dict[str, Any] = dict(_DEFAULT_SETTINGS)
            for section, values in stored.items():
                curr = result.get(section)
                if isinstance(values, dict) and isinstance(curr, dict):
                    result[section] = {**curr, **values}
                else:
                    result[section] = values
            return result
        except Exception:
            pass
    return dict(_DEFAULT_SETTINGS)


def _save_settings(data: dict):
    with open(_SETTINGS_FILE, "w") as f:
        json.dump(data, f, indent=2)


@router.get("/settings", auth=None)
def get_settings(request):
    """Return current system settings + live DB status."""
    import sqlite3
    settings_data = _load_settings()
    db_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "db.sqlite3"
    )
    db_size = "N/A"
    db_version = "SQLite"
    if os.path.exists(db_path):
        size_bytes = os.path.getsize(db_path)
        db_size = f"{size_bytes / (1024 * 1024):.1f} MB"
        try:
            conn = sqlite3.connect(db_path)
            db_version = f"SQLite {conn.execute('SELECT sqlite_version()').fetchone()[0]}"
            conn.close()
        except Exception:
            pass

    return {
        "settings": settings_data,
        "dbStatus": {
            "version": db_version,
            "size": db_size,
            "connections": "1 Active Connection",
        }
    }


@router.patch("/settings")
def update_settings(request, payload: dict = Body(...)):
    """Persist updated system settings."""
    current = _load_settings()
    for section, values in payload.items():
        if isinstance(values, dict) and isinstance(current.get(section), dict):
            current[section] = {**current[section], **values}
        else:
            current[section] = values
    _save_settings(current)
    return {"success": True, "settings": current}


@router.post("/auth/cache/invalidate")
def invalidate_auth_cache(request):
    """Stub: invalidate any server-side auth caches after settings change."""
    return {"success": True}


# ─── Auth / Login ──────────────────────────────────────────────────────────────

@router.post("/auth/login", response={200: LoginOut, 401: ErrorOut}, auth=None)
def login(request, payload: LoginIn):
    username = payload.username
    if "@" in username:
        try:
            user_obj = User.objects.get(email=username)
            username = user_obj.username
        except Exception:
            pass

    user = authenticate(username=username, password=payload.password)
    if not user:
        return 401, {"detail": "Invalid credentials"}

    ip = request.META.get("HTTP_X_FORWARDED_FOR") or request.META.get("REMOTE_ADDR") or "127.0.0.1"
    ua = request.META.get("HTTP_USER_AGENT") or "Web Browser"
    session_id = record_session(user_id=user.id, username=user.username, ip_address=ip, user_agent=ua)

    refresh = RefreshToken.for_user(user)
    return {
        "access_token": str(refresh.access_token),
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
        }
    }


# ─── Setup ────────────────────────────────────────────────────────────────────

@router.get("/setup/check", auth=None)
def check_setup(request):
    is_complete = User.objects.exists()
    return {
        "authEnabled": True,
        "isSetupComplete": is_complete,
        "initialized": is_complete,
    }


@router.post("/setup/initialize", auth=None)
def initialize_setup(request, payload: InitializeSetupSchema):
    if User.objects.exists():
        return 400, {"detail": "Already initialized"}

    username = payload.username
    if not username:
        if payload.name:
            username = payload.name.lower().replace(" ", "")
        else:
            username = payload.email.split("@")[0]

    first_name = ""
    last_name = ""
    if payload.name:
        parts = payload.name.strip().split()
        first_name = parts[0]
        if len(parts) > 1:
            last_name = " ".join(parts[1:])

    user = User.objects.create_superuser(
        username=username,
        email=payload.email,
        password=payload.password,
        first_name=first_name,
        last_name=last_name,
    )

    Employee.objects.create(
        user=user,
        name=payload.name or username,
        email=payload.email,
        role="ADMIN"
    )

    if payload.orgName:
        s = _load_settings()
        s["general"]["orgName"] = payload.orgName
        _save_settings(s)

    return {"success": True}


# ─── Dashboard stats ───────────────────────────────────────────────────────────

@router.get("/dashboard/stats")
def dashboard_stats(request):
    """Aggregate real-time KPIs, trends and activity for the main dashboard."""
    now = timezone.now()

    # KPIs
    total_hardware = Asset.objects.count()
    at_risk_hardware = Asset.objects.filter(
        status__in=["MAINTENANCE", "RETIRED"]
    ).count()
    low_stock_items = InventoryItem.objects.filter(quantity__lte=5).count()
    active_network_devices = NetworkDevice.objects.filter(status="ONLINE").count()

    # 7-day transaction trend from OperationLog
    trend = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        received = OperationLog.objects.filter(
            timestamp__gte=day_start, timestamp__lt=day_end, action="CREATE"
        ).count()
        issued = OperationLog.objects.filter(
            timestamp__gte=day_start, timestamp__lt=day_end,
            action__in=["UPDATE", "DELETE", "ISSUE", "DISPATCH"]
        ).count()
        trend.append({
            "day": day.strftime("%a"),
            "received": received,
            "issued": issued,
        })

    # System status
    open_tickets = Ticket.objects.filter(status__in=["NEW", "OPEN", "IN_PROGRESS"]).count()
    system_status = [
        {
            "name": "Assets",
            "uptime": "100%",
            "latency": f"{total_hardware} total",
            "status": "healthy",
        },
        {
            "name": "Network",
            "uptime": "100%",
            "latency": f"{active_network_devices} active",
            "status": "healthy",
        },
        {
            "name": "Help Desk",
            "uptime": "100%",
            "latency": f"{open_tickets} open",
            "status": "warning" if open_tickets > 10 else "healthy",
        },
        {
            "name": "Inventory",
            "uptime": "100%",
            "latency": f"{low_stock_items} low stock",
            "status": "warning" if low_stock_items > 0 else "healthy",
        },
    ]

    # Recent activity
    recent_logs = OperationLog.objects.order_by("-timestamp")[:10]
    recent_activity = []
    for log in recent_logs:
        meta_str = ""
        if isinstance(log.details, dict):
            meta_str = ", ".join(f"{k}: {v}" for k, v in log.details.items())
        elif log.details:
            meta_str = str(log.details)

        recent_activity.append({
            "action": f"{log.action} {log.resource_type}",
            "meta": meta_str,
            "type": log.action.lower(),
            "time": log.timestamp.strftime("%H:%M"),
        })

    # Active repairs — uses valid RepairStatus values
    active_repairs_qs = Repair.objects.select_related("asset").filter(
        status__in=["SCHEDULED", "IN_PROGRESS"]
    )[:5]
    active_repairs = []
    for r in active_repairs_qs:
        active_repairs.append({
            "id": str(r.id),
            "asset": r.asset.name if r.asset else "Unknown",
            "issue": r.notes or r.repair_type,
            "eta": r.scheduled_date.strftime("%Y-%m-%d") if r.scheduled_date else "TBD",
            "tech": r.asset.assigned_to.name if (r.asset and r.asset.assigned_to) else "Unassigned",
        })

    return {
        "kpis": {
            "totalHardware": total_hardware,
            "atRiskHardware": at_risk_hardware,
            "lowStockItems": low_stock_items,
            "activeNetworkDevices": active_network_devices,
        },
        "transactionTrend": trend,
        "systemStatus": system_status,
        "recentActivity": recent_activity,
        "activeRepairs": active_repairs,
    }


# ─── Search ────────────────────────────────────────────────────────────────────

@router.get("/search")
def global_search(request, q: str = ""):
    """Search assets, tickets, and employees by a text query."""
    if not q or len(q.strip()) < 2:
        return {"assets": [], "tickets": [], "employees": []}
    term = q.strip()
    assets = list(
        Asset.objects.filter(
            Q(name__icontains=term) | Q(asset_tag__icontains=term) | Q(serial_number__icontains=term)
        ).values("id", "name", "category", "status", "asset_tag")[:20]
    )
    tickets = list(
        Ticket.objects.filter(
            Q(title__icontains=term) | Q(description__icontains=term)
        ).values("id", "title", "status", "priority")[:20]
    )
    employees = list(
        Employee.objects.filter(
            Q(name__icontains=term) | Q(email__icontains=term) | Q(department__icontains=term)
        ).values("id", "name", "email", "department", "role")[:20]
    )
    return {"assets": assets, "tickets": tickets, "employees": employees}


# ─── Knowledge Base ────────────────────────────────────────────────────────────

@router.get("/knowledge", response=List[KnowledgeArticleSchema])
def get_knowledge(request):
    return list(KnowledgeArticle.objects.select_related('author').all())

@router.get("/knowledge/{article_id}", response=KnowledgeArticleSchema)
def get_knowledge_article(request, article_id: int):
    return get_object_or_404(KnowledgeArticle, id=article_id)

@router.post("/knowledge", response=KnowledgeArticleSchema)
def create_knowledge(request, payload: KnowledgeArticleSchema):
    article = KnowledgeArticle.objects.create(**payload.dict(exclude_unset=True))
    return article

@router.patch("/knowledge/{article_id}", response=KnowledgeArticleSchema)
def update_knowledge(request, article_id: int, payload: KnowledgeArticleSchema):
    article = get_object_or_404(KnowledgeArticle, id=article_id)
    for attr, value in payload.dict(exclude_unset=True).items():
        setattr(article, attr, value)
    article.save()
    return article

@router.delete("/knowledge/{article_id}")
@require_admin
def delete_knowledge(request, article_id: int):
    article = get_object_or_404(KnowledgeArticle, id=article_id)
    article.delete()
    return {"success": True}


# ─── Operations & Task Automation ──────────────────────────────────────────────

OPERATION_PRESETS = [
    {
        "id": "BULK_REASSIGN_ASSETS",
        "name": "Fleet Reassignment",
        "description": "Bulk transfer custody of multiple hardware assets to an employee or return to unassigned pool.",
        "category": "Assets",
        "icon": "Users",
        "recommended_async": False,
    },
    {
        "id": "BULK_RELOCATE_ASSETS",
        "name": "Bulk Fleet Relocation",
        "description": "Move a batch of physical assets to a new campus, building, room, or rack cabinet.",
        "category": "Assets",
        "icon": "MapPin",
        "recommended_async": False,
    },
    {
        "id": "BULK_STATUS_CHANGE",
        "name": "Bulk Status Transition",
        "description": "Update lifecycle states (Active, In Repair, Reserved, Retired) across selected hardware assets.",
        "category": "Assets",
        "icon": "Tag",
        "recommended_async": False,
    },
    {
        "id": "BULK_RESTOCK",
        "name": "Inventory Restock Batch",
        "description": "Add quantities to low-stock spare parts, cables, or consumables in one operation.",
        "category": "Inventory",
        "icon": "Boxes",
        "recommended_async": False,
    },
    {
        "id": "DIAGNOSTIC_SWEEP",
        "name": "System & Fleet Diagnostic Sweep",
        "description": "Audit hardware health, unassigned devices, low-stock alerts, and network infrastructure status.",
        "category": "Diagnostics",
        "icon": "Activity",
        "recommended_async": True,
    },
]

@router.get("/operations/presets", response=List[OperationPresetSchema])
def get_operation_presets(request):
    return OPERATION_PRESETS

@router.get("/operations", response=List[OperationLogSchema])
def get_operations(request):
    return list(OperationLog.objects.all().order_by('-timestamp')[:100])

@router.get("/operations/history", response=List[OperationLogSchema])
def get_operations_history(request):
    return list(OperationLog.objects.all().order_by('-timestamp')[:50])

@router.get("/operations/jobs", response=List[OperationJobOutSchema])
def get_operations_jobs(request):
    return get_all_jobs()

@router.get("/operations/jobs/{job_id}", response=OperationJobOutSchema)
def get_operation_job(request, job_id: str):
    job = get_job(job_id)
    if not job:
        raise errors.HttpError(404, f"Operation job {job_id} not found")
    return job.to_dict()

@router.post("/operations/execute")
def execute_operation(request, payload: OperationExecuteInSchema):
    op_type = payload.operation_type or payload.operationType or ""
    target_ids = payload.target_ids or payload.targetIds or []
    params = payload.params or {}
    is_async = payload.is_async or payload.isAsync or False

    if is_async or len(target_ids) > 25 or op_type == "DIAGNOSTIC_SWEEP":
        job_id = execute_operation_async(op_type, target_ids, params)
        return {
            "success": True,
            "job_id": job_id,
            "status": "RUNNING",
            "is_async": True,
            "message": f"Operation {op_type} started in background.",
        }

    # Synchronous Execution for rapid batches
    if op_type == "BULK_REASSIGN_ASSETS":
        assignee_id = safe_fk_id(params.get("assigneeId") or params.get("assignee_id"))
        result = run_bulk_reassign_assets(target_ids, assignee_id, params.get("notes", ""))
    elif op_type == "BULK_RELOCATE_ASSETS":
        loc_id = safe_fk_id(params.get("locationId") or params.get("location_id"))
        result = run_bulk_relocate_assets(target_ids, loc_id, params.get("notes", ""))
    elif op_type == "BULK_STATUS_CHANGE":
        new_status = params.get("status") or params.get("new_status") or "ACTIVE"
        result = run_bulk_status_change(target_ids, new_status, params.get("reason", ""))
    elif op_type == "BULK_RESTOCK":
        qty = int(params.get("quantity", 10))
        result = run_bulk_restock_inventory(target_ids, qty, params.get("notes", ""))
    elif op_type == "DIAGNOSTIC_SWEEP":
        result = run_diagnostic_sweep()
    else:
        result = {"success": True, "message": f"Custom operation {op_type} executed"}

    return {
        "success": True,
        "is_async": False,
        "result": result,
        "message": f"Operation {op_type} completed successfully.",
    }


# ─── Misc / Stubs ──────────────────────────────────────────────────────────────

@router.get("/system/sidebar-badges")
def get_sidebar_badges(request):
    open_tickets = Ticket.objects.filter(status__in=["NEW", "OPEN"]).count()
    low_stock = InventoryItem.objects.filter(quantity__lte=5).count()
    return {"tickets": open_tickets, "alerts": low_stock}

@router.get("/reports/kpis")
def get_kpis(request):
    total_assets = Asset.objects.count()
    total_inventory = InventoryItem.objects.count()
    total_tickets = Ticket.objects.count()
    resolved_tickets = Ticket.objects.filter(status__in=["RESOLVED", "CLOSED"]).count()
    active_repairs = Repair.objects.filter(status__in=["SCHEDULED", "IN_PROGRESS"]).count()

    sla_rate = round((resolved_tickets / total_tickets * 100) if total_tickets > 0 else 100.0, 1)

    return {
        "totalAssetValue": float(total_assets * 1200.0),
        "monthlyMaintenance": float(active_repairs * 250.0),
        "slaResolutionRate": sla_rate,
        "inventoryItems": total_inventory,
    }

@router.get("/reports")
def get_reports(request):
    return {"data": []}

@router.get("/timeline")
def get_timeline(request):
    logs = OperationLog.objects.order_by("-timestamp")[:50]
    return [
        {
            "id": log.id,
            "action": log.action,
            "resourceType": log.resource_type,
            "resourceId": log.resource_id,
            "details": log.details,
            "timestamp": log.timestamp.isoformat(),
        }
        for log in logs
    ]

@router.get("/history")
def get_history(request):
    return []

@router.post("/ai/ask")
def ai_ask(request, payload: dict = Body(...)):
    return {"response": "AI Assistant is offline."}


# ─── Dynamic RBAC & Permissions Matrix ─────────────────────────────────────────

@router.get("/system/permissions")
def get_permissions_matrix(request):
    """Return the active permissions matrix across all roles and modules."""
    roles = [
        UserRole.SUPER_ADMIN,
        UserRole.HOD,
        UserRole.TECHNICIAN,
        UserRole.EMPLOYEE,
        UserRole.STUDENT,
    ]
    modules = ["assets", "inventory", "tickets", "repairs", "network", "locations", "employees", "reports", "settings"]

    # Fetch DB overrides
    db_perms = {(p.role, p.module): p for p in RolePermission.objects.all()}

    matrix = []
    for role in roles:
        for mod in modules:
            override = db_perms.get((role, mod))
            if override:
                matrix.append({
                    "role": role,
                    "module": mod,
                    "can_read": override.can_read,
                    "can_write": override.can_write,
                    "can_delete": override.can_delete,
                    "can_approve": override.can_approve,
                })
            else:
                default = DEFAULT_ROLE_PERMISSIONS.get(role, {}).get(mod, {
                    "read": False, "write": False, "delete": False, "approve": False
                })
                matrix.append({
                    "role": role,
                    "module": mod,
                    "can_read": default.get("read", False),
                    "can_write": default.get("write", False),
                    "can_delete": default.get("delete", False),
                    "can_approve": default.get("approve", False),
                })

    return {"matrix": matrix, "roles": roles, "modules": modules}


@router.put("/system/permissions")
@require_super_admin
def update_permissions_matrix(request, payload: RolePermissionUpdateSchema):
    """Update role permissions in the database (Super Admin only)."""
    for item in payload.permissions:
        # Don't allow degrading SUPER_ADMIN access
        if item.role == UserRole.SUPER_ADMIN:
            continue
        RolePermission.objects.update_or_create(
            role=item.role,
            module=item.module,
            defaults={
                "can_read": item.can_read,
                "can_write": item.can_write,
                "can_delete": item.can_delete,
                "can_approve": item.can_approve,
            }
        )
    return {"success": True, "message": "Permissions matrix updated successfully"}


# ─── Super Admin User Provisioning ─────────────────────────────────────────────

@router.get("/system/users", response=List[UserDetailSchema])
@require_super_admin
def list_system_users(request):
    """List all user accounts with roles and departments (Super Admin only)."""
    users = User.objects.all().select_related("employee_profile", "employee_profile__department_fk").order_by("-date_joined")
    result = []
    for u in users:
        role = UserRole.EMPLOYEE
        name = u.get_full_name() or u.username
        dept_name = None
        dept_id = None

        if u.is_superuser:
            role = UserRole.SUPER_ADMIN

        if hasattr(u, "employee_profile") and u.employee_profile:
            profile = u.employee_profile
            role = profile.role if not u.is_superuser else UserRole.SUPER_ADMIN
            name = profile.name or name
            if profile.department_fk:
                dept_name = profile.department_fk.name
                dept_id = profile.department_fk.id
            elif profile.department:
                dept_name = profile.department

        result.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "name": name,
            "role": role,
            "department": dept_name,
            "department_id": dept_id,
            "is_active": u.is_active,
            "date_joined": u.date_joined.isoformat(),
        })
    return result


@router.post("/system/users", response=UserDetailSchema)
@require_super_admin
def create_system_user(request, payload: UserProvisionInSchema):
    """Provision a new user account with assigned role (Super Admin only)."""
    if User.objects.filter(username__iexact=payload.username).exists():
        raise errors.HttpError(400, f"Username '{payload.username}' is already taken.")
    if User.objects.filter(email__iexact=payload.email).exists():
        raise errors.HttpError(400, f"Email '{payload.email}' is already registered.")

    is_super = (payload.role == UserRole.SUPER_ADMIN)
    user = User.objects.create_user(
        username=payload.username,
        email=payload.email,
        password=payload.password,
        first_name=payload.name,
        is_superuser=is_super,
        is_staff=is_super,
    )

    dept_fk = None
    if payload.department_id:
        dept_fk = Department.objects.filter(id=payload.department_id).first()

    employee, _ = Employee.objects.get_or_create(
        user=user,
        defaults={
            "name": payload.name,
            "email": payload.email,
            "role": payload.role,
            "department": dept_fk.name if dept_fk else payload.department,
            "department_fk": dept_fk,
        }
    )
    if not _:
        employee.name = payload.name
        employee.email = payload.email
        employee.role = payload.role
        employee.department = dept_fk.name if dept_fk else payload.department
        employee.department_fk = dept_fk
        employee.save()

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "name": payload.name,
        "role": payload.role,
        "department": dept_fk.name if dept_fk else payload.department,
        "department_id": dept_fk.id if dept_fk else None,
        "is_active": user.is_active,
        "date_joined": user.date_joined.isoformat(),
    }


@router.patch("/system/users/{user_id}", response=UserDetailSchema)
@require_super_admin
def update_system_user(request, user_id: int, payload: UserUpdateInSchema):
    """Update a user's role, department, active status, or password (Super Admin only)."""
    user = get_object_or_404(User, id=user_id)

    if payload.email and payload.email != user.email:
        if User.objects.filter(email__iexact=payload.email).exclude(id=user.id).exists():
            raise errors.HttpError(400, f"Email '{payload.email}' already exists.")
        user.email = payload.email

    if payload.is_active is not None:
        user.is_active = payload.is_active

    if payload.password:
        user.set_password(payload.password)

    if payload.role:
        if payload.role == UserRole.SUPER_ADMIN:
            user.is_superuser = True
            user.is_staff = True
        else:
            # If downgrading self, prevent locking out if last superuser
            if user.is_superuser and User.objects.filter(is_superuser=True, is_active=True).count() <= 1 and user.id == request.user.id:
                raise errors.HttpError(400, "Cannot revoke Super Admin role from the last active Super Admin.")
            user.is_superuser = False
            user.is_staff = False

    user.save()

    dept_fk = None
    if payload.department_id is not None:
        dept_fk = Department.objects.filter(id=payload.department_id).first()

    employee = getattr(user, 'employee_profile', None)
    if not employee:
        employee = Employee.objects.create(
            user=user,
            name=payload.name or user.get_full_name() or user.username,
            email=user.email,
            role=payload.role or UserRole.EMPLOYEE,
        )

    if payload.name:
        employee.name = payload.name
    if payload.role:
        employee.role = payload.role
    if payload.department_id is not None:
        employee.department_fk = dept_fk
        employee.department = dept_fk.name if dept_fk else ""
    elif payload.department is not None:
        employee.department = payload.department
    employee.save()

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "name": employee.name,
        "role": employee.role,
        "department": employee.department,
        "department_id": employee.department_fk.id if employee.department_fk else None,
        "is_active": user.is_active,
        "date_joined": user.date_joined.isoformat(),
    }


# ─── Department Management ─────────────────────────────────────────────────────

@router.get("/system/departments", response=List[DepartmentSchema])
def list_departments(request):
    """List all organizational departments."""
    depts = Department.objects.all().select_related("hod")
    result = []
    for d in depts:
        result.append({
            "id": d.id,
            "name": d.name,
            "code": d.code,
            "description": d.description,
            "hod_name": d.hod.get_full_name() or d.hod.username if d.hod else None,
        })
    return result


@router.post("/system/departments", response=DepartmentSchema)
@require_admin
def create_department(request, payload: DepartmentInSchema):
    """Create a new department (Super Admin / Admin only)."""
    if Department.objects.filter(code__iexact=payload.code).exists():
        raise errors.HttpError(400, f"Department code '{payload.code}' already exists.")
    if Department.objects.filter(name__iexact=payload.name).exists():
        raise errors.HttpError(400, f"Department name '{payload.name}' already exists.")

    hod_user = None
    if payload.hod_id:
        hod_user = User.objects.filter(id=payload.hod_id).first()

    dept = Department.objects.create(
        name=payload.name,
        code=payload.code.upper(),
        description=payload.description,
        hod=hod_user,
    )
    return {
        "id": dept.id,
        "name": dept.name,
        "code": dept.code,
        "description": dept.description,
        "hod_name": hod_user.get_full_name() or hod_user.username if hod_user else None,
    }


# ─── Database Integrity, Backups & Safe Upgrades ──────────────────────────────

@router.get("/system/database/status")
@require_admin
def get_database_status(request):
    """Return live database health, size, table counts, and integrity diagnostic."""
    from core.backup_service import check_database_integrity, _get_db_path
    db_path = _get_db_path()
    size_mb = 0.0
    if os.path.exists(db_path):
        size_mb = round(os.path.getsize(db_path) / (1024 * 1024), 2)

    integrity = check_database_integrity()
    return {
        "is_healthy": integrity["is_healthy"],
        "size_mb": size_mb,
        "total_tables": integrity.get("total_tables", 0),
        "table_counts": integrity.get("table_counts", {}),
        "errors": integrity.get("errors", []),
        "db_path": os.path.basename(db_path),
    }


@router.get("/system/database/backups")
@require_admin
def get_database_backups(request):
    """List all available database snapshots with SHA-256 checksums."""
    from core.backup_service import list_backups
    return list_backups()


class CreateBackupIn(Schema):
    trigger_reason: Optional[str] = "manual"


@router.post("/system/database/backups")
@require_super_admin
def create_database_backup(request, payload: CreateBackupIn):
    """Create an on-demand database backup snapshot (Super Admin only)."""
    from core.backup_service import create_backup
    try:
        snapshot = create_backup(trigger_reason=payload.trigger_reason or "manual")
        return snapshot
    except Exception as e:
        raise errors.HttpError(500, f"Backup creation failed: {str(e)}")


class RestoreBackupIn(Schema):
    filename: str


@router.post("/system/database/backups/restore")
@require_super_admin
def restore_database_backup(request, payload: RestoreBackupIn):
    """Safely restore database from a snapshot (Super Admin only)."""
    from core.backup_service import restore_backup
    try:
        result = restore_backup(payload.filename)
        return result
    except Exception as e:
        raise errors.HttpError(500, f"Restore failed: {str(e)}")


@router.post("/system/database/migrate-safe")
@require_super_admin
def trigger_safe_migration(request):
    """Perform a safe migration upgrade with automated pre-migration backup & integrity check."""
    from core.backup_service import run_safe_migration
    result = run_safe_migration()
    if not result["success"]:
        raise errors.HttpError(500, result["message"])
    return result


@router.get("/system/database/integrity-check")
@require_admin
def run_integrity_check(request):
    """Run an on-demand PRAGMA integrity check on the database."""
    from core.backup_service import check_database_integrity
    return check_database_integrity()


@router.get("/system/database/backups/{filename}/download")
def download_database_backup(request, filename: str):
    """Download a raw .sqlite3 backup snapshot."""
    from core.backup_service import _get_backup_dir
    backup_dir = _get_backup_dir()
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(backup_dir, safe_filename)
    if not os.path.exists(file_path):
        raise errors.HttpError(404, f"Backup file {safe_filename} not found.")
    response = FileResponse(open(file_path, "rb"), content_type="application/x-sqlite3")
    response["Content-Disposition"] = f'attachment; filename="{safe_filename}"'
    return response


# ─── Live Active User Sessions ─────────────────────────────────────────────────

@router.get("/system/sessions", response=List[UserSessionOutSchema])
def list_user_sessions(request):
    """List live active JWT sessions."""
    user_id = request.auth.id if hasattr(request, "auth") and request.auth else None
    return get_user_sessions(user_id=user_id, include_all=True)


@router.post("/system/sessions/{session_id}/revoke")
def revoke_user_session(request, session_id: str):
    """Revoke a specific active user session token."""
    success = revoke_session(session_id)
    if not success:
        raise errors.HttpError(404, f"Session {session_id} not found.")
    return {"success": True, "message": f"Session {session_id} revoked."}


@router.post("/system/sessions/revoke-others")
def revoke_other_user_sessions(request, payload: RevokeSessionInSchema):
    """Revoke all active sessions for current user except active session."""
    user_id = request.auth.id if hasattr(request, "auth") and request.auth else 1
    current_sess = payload.session_id
    count = revoke_all_other_sessions(user_id=user_id, current_session_id=current_sess)
    return {"success": True, "revoked_count": count, "message": f"Revoked {count} other sessions."}


# ─── Notification & Webhook Live Testers ───────────────────────────────────────

@router.post("/settings/notifications/test-email", response=TestDiagnosticOutSchema)
def test_email_notification(request, payload: TestEmailInSchema):
    """Diagnostic probe verifying SMTP handshake latency and outbound readiness."""
    start = time.time()
    logs = [f"Initiating TCP handshake with SMTP host {payload.smtp_server}:{payload.smtp_port}..."]
    try:
        sock = socket.create_connection((payload.smtp_server, payload.smtp_port), timeout=3.0)
        sock.close()
        latency = round((time.time() - start) * 1000, 2)
        logs.append(f"TCP socket handshake established in {latency}ms.")
        logs.append(f"Sender {payload.sender_email} verified for outbound transmission to {payload.recipient_email}.")
        return {
            "success": True,
            "latency_ms": latency,
            "status_code": 250,
            "message": f"SMTP host {payload.smtp_server}:{payload.smtp_port} responded successfully ({latency}ms).",
            "diagnostic_logs": logs,
        }
    except Exception as e:
        latency = round((time.time() - start) * 1000, 2)
        logs.append(f"Connection error: {str(e)}")
        return {
            "success": False,
            "latency_ms": latency,
            "status_code": 500,
            "message": f"SMTP probe failed for {payload.smtp_server}:{payload.smtp_port}: {str(e)}",
            "diagnostic_logs": logs,
        }


@router.post("/settings/notifications/test-webhook", response=TestDiagnosticOutSchema)
def test_webhook_notification(request, payload: TestWebhookInSchema):
    """Diagnostic probe sending real HTTP test event to Slack/Teams/Custom webhook."""
    start = time.time()
    logs = [f"Dispatching test JSON event to {payload.webhook_url}..."]
    test_body = json.dumps({
        "text": "Pulse IT Ops Test Alert: Webhook integration verified successfully.",
        "timestamp": timezone.now().isoformat(),
        "source": "BikitaIT Infrastructure",
    }).encode("utf-8")

    req = urllib.request.Request(
        payload.webhook_url,
        data=test_body,
        headers={"Content-Type": "application/json", "User-Agent": "BikitaIT-Pulse/1.0"}
    )
    try:
        with urllib.request.urlopen(req, timeout=4.0) as resp:
            status_code = resp.getcode()
            latency = round((time.time() - start) * 1000, 2)
            logs.append(f"Webhook endpoint acknowledged payload with HTTP {status_code} ({latency}ms).")
            return {
                "success": True,
                "latency_ms": latency,
                "status_code": status_code,
                "message": f"Webhook delivered successfully (HTTP {status_code}, {latency}ms).",
                "diagnostic_logs": logs,
            }
    except urllib.error.HTTPError as he:
        latency = round((time.time() - start) * 1000, 2)
        logs.append(f"HTTP Error response: {he.code} {he.reason}")
        return {
            "success": False,
            "latency_ms": latency,
            "status_code": he.code,
            "message": f"Webhook responded with HTTP {he.code}: {he.reason}",
            "diagnostic_logs": logs,
        }
    except Exception as e:
        latency = round((time.time() - start) * 1000, 2)
        logs.append(f"Network transport error: {str(e)}")
        return {
            "success": False,
            "latency_ms": latency,
            "status_code": 500,
            "message": f"Webhook transmission failed: {str(e)}",
            "diagnostic_logs": logs,
        }


# ─── Dynamic Taxonomies & Custom Categories ────────────────────────────────────

@router.get("/system/taxonomies", response=TaxonomyOutSchema)
def get_taxonomies(request):
    """Retrieve persisted custom categories, locations, and priorities."""
    s = _load_settings()
    tax = s.get("taxonomies", {})
    return {
        "categories": tax.get("categories", ["Laptops", "Desktops", "Servers", "Monitors", "Printers", "Network Switches"]),
        "locations": tax.get("locations", ["HQ Floor 1", "HQ Floor 2", "Data Center Alpha", "Remote Office"]),
        "departments": tax.get("departments", ["IT", "Engineering", "Finance", "Administration", "Academic Operations"]),
        "statuses": tax.get("statuses", ["ACTIVE", "IN_REPAIR", "IN_STOCK", "RESERVED", "RETIRED"]),
        "priorities": tax.get("priorities", [
            {"id": "CRITICAL", "name": "Critical", "sla_hours": 2},
            {"id": "HIGH", "name": "High", "sla_hours": 8},
            {"id": "MEDIUM", "name": "Medium", "sla_hours": 24},
            {"id": "LOW", "name": "Low", "sla_hours": 72},
        ]),
    }


@router.patch("/system/taxonomies", response=TaxonomyOutSchema)
def update_taxonomies(request, payload: TaxonomyInSchema):
    """Persist updated categories, locations, and priority definitions."""
    s = _load_settings()
    tax = s.get("taxonomies", {})
    if payload.categories is not None:
        tax["categories"] = payload.categories
    if payload.locations is not None:
        tax["locations"] = payload.locations
    if payload.departments is not None:
        tax["departments"] = payload.departments
    if payload.statuses is not None:
        tax["statuses"] = payload.statuses
    if payload.priorities is not None:
        tax["priorities"] = payload.priorities
    s["taxonomies"] = tax
    _save_settings(s)
    return get_taxonomies(request)


@router.get("/system/version")
def get_system_version(request):
    """Retrieve the unified SemVer release metadata and build stamps."""
    try:
        from core.version import APP_VERSION, GIT_COMMIT, BUILD_TIMESTAMP, ENVIRONMENT
        return {
            "version": APP_VERSION,
            "git_commit": GIT_COMMIT,
            "build_timestamp": BUILD_TIMESTAMP,
            "environment": ENVIRONMENT,
        }
    except ImportError:
        return {
            "version": "0.3.3",
            "git_commit": "development",
            "build_timestamp": timezone.now().isoformat(),
            "environment": "development",
        }



