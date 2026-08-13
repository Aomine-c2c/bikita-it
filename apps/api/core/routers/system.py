from core.permissions import require_admin
from ninja import Router
from typing import List, Dict, Any
from django.contrib.auth.models import User
from ninja_jwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from core.models import (
    KnowledgeArticle, OperationLog,
    Asset, NetworkDevice, InventoryItem, Repair, Ticket
)
from .schemas import KnowledgeArticleSchema, OperationLogSchema, LoginIn, LoginOut, ErrorOut

router = Router()

@router.post("/auth/login", response={200: LoginOut, 401: ErrorOut}, auth=None)
def login(request, payload: LoginIn):
    # Support login by email: resolve email to username if needed
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
            "last_name": user.last_name
        }
    }

@router.get("/setup/check", auth=None)
def check_setup(request):
    is_complete = User.objects.exists()
    return {
        "authEnabled": True,
        "isSetupComplete": is_complete,
        "initialized": is_complete
    }

@router.get("/dashboard/stats")
def dashboard_stats(request):
    """Aggregate real-time KPIs, trends and activity for the main dashboard."""
    now = timezone.now()

    # -- KPIs --
    total_hardware = Asset.objects.count()
    at_risk_hardware = Asset.objects.filter(status__in=["UNDER_REPAIR", "RETIRED", "DECOMMISSIONED"]).count()
    low_stock_items = InventoryItem.objects.filter(quantity__lte=5).count()
    active_network_devices = NetworkDevice.objects.filter(status="ACTIVE").count()

    # -- 7-day transaction trend (OperationLog entries per day) --
    trend = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        received = OperationLog.objects.filter(
            timestamp__gte=day_start, timestamp__lt=day_end, action="CREATE"
        ).count()
        issued = OperationLog.objects.filter(
            timestamp__gte=day_start, timestamp__lt=day_end, action__in=["UPDATE", "DELETE"]
        ).count()
        trend.append({
            "day": day.strftime("%a"),
            "received": received,
            "issued": issued,
        })

    # -- System status --
    open_tickets = Ticket.objects.filter(status="OPEN").count()
    system_status = [
        {"name": "Assets", "uptime": "100%", "latency": f"{total_hardware} total", "status": "healthy"},
        {"name": "Network", "uptime": "100%", "latency": f"{active_network_devices} active", "status": "healthy"},
        {"name": "Help Desk", "uptime": "100%", "latency": f"{open_tickets} open", "status": "healthy"},
        {"name": "Inventory", "uptime": "100%", "latency": f"{low_stock_items} low stock", "status": "warning" if low_stock_items > 0 else "healthy"},
    ]

    # -- Recent activity from OperationLog --
    recent_logs = OperationLog.objects.order_by("-timestamp")[:10]
    recent_activity = []
    for log in recent_logs:
        recent_activity.append({
            "action": f"{log.action} {log.resource_type}",
            "meta": log.details or "",
            "type": log.action.lower(),
            "time": log.timestamp.strftime("%H:%M"),
        })

    # -- Active repairs (Repair model: status, notes, asset, scheduled_date) --
    active_repairs_qs = Repair.objects.select_related("asset").filter(
        status__in=["PENDING", "IN_PROGRESS"]
    )[:5]
    active_repairs = []
    for r in active_repairs_qs:
        active_repairs.append({
            "id": str(r.id),
            "asset": r.asset.name if r.asset else "Unknown",
            "issue": r.notes or "",
            "eta": r.scheduled_date.strftime("%Y-%m-%d") if r.scheduled_date else "TBD",
            "tech": "Assigned",
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

@router.post("/setup/initialize", auth=None)
def initialize_setup(request, payload: dict):
    if User.objects.exists():
        return 400, {"detail": "Already initialized"}
    user = User.objects.create_superuser(
        username=payload.get("username", "admin"),
        email=payload.get("email", "admin@example.com"),
        password=payload.get("password", "admin")
    )
    return {"success": True}

# Knowledge Base
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

# Operations
@router.get("/operations", response=List[OperationLogSchema])
def get_operations(request):
    return list(OperationLog.objects.all())

@router.get("/operations/history", response=List[OperationLogSchema])
def get_operations_history(request):
    return list(OperationLog.objects.all().order_by('-timestamp')[:50])

@router.post("/operations/execute")
def execute_operation(request, payload: dict):
    # Stub
    return {"success": True}

# Dashboards & Extras
@router.get("/system/sidebar-badges")
def get_sidebar_badges(request):
    return {"tickets": 0, "alerts": 0}

@router.get("/reports/kpis")
def get_kpis(request):
    return {
        "totalAssetValue": 0,
        "activeIncidents": 0,
        "networkHealthScore": 100,
        "complianceRate": 100
    }

@router.get("/reports")
def get_reports(request):
    return {"data": []}

@router.get("/timeline")
def get_timeline(request):
    return []

@router.get("/history")
def get_history(request):
    return []

@router.post("/ai/ask")
def ai_ask(request, payload: dict):
    return {"response": "AI Assistant is offline."}
