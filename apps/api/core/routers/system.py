import json
import os
from core.permissions import require_admin
from ninja import Router, Body
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
    Asset, NetworkDevice, InventoryItem, Repair, Ticket, Employee
)
from .schemas import KnowledgeArticleSchema, OperationLogSchema, LoginIn, LoginOut, ErrorOut, InitializeSetupSchema

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
            result = dict(_DEFAULT_SETTINGS)
            for section, values in stored.items():
                if isinstance(values, dict) and isinstance(result.get(section), dict):
                    result[section] = {**result[section], **values}
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
        except (User.DoesNotExist, User.MultipleObjectsReturned):
            pass

    user = authenticate(username=username, password=payload.password)
    if not user:
        return 401, {"detail": "Invalid credentials"}

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


# ─── Operations ────────────────────────────────────────────────────────────────

@router.get("/operations", response=List[OperationLogSchema])
def get_operations(request):
    return list(OperationLog.objects.all())

@router.get("/operations/history", response=List[OperationLogSchema])
def get_operations_history(request):
    return list(OperationLog.objects.all().order_by('-timestamp')[:50])

@router.post("/operations/execute")
def execute_operation(request, payload: dict = Body(...)):
    return {"success": True}


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
