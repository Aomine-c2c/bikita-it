from core.permissions import require_admin
from ninja import Router, Schema
from typing import List, Optional
from django.shortcuts import get_object_or_404
from django.utils import timezone
from core.models import Asset, AssetHistory, Employee, OperationLog
from .schemas import AssetSchema, AssetInSchema, AssetHistorySchema

router = Router()

# ─── Core CRUD ────────────────────────────────────────────────────────────────

@router.get("", response=List[AssetSchema])
def get_assets(request):
    return list(Asset.objects.select_related('assigned_to', 'location').all())

@router.get("/{asset_id}", response=AssetSchema)
def get_asset(request, asset_id: int):
    return get_object_or_404(Asset, id=asset_id)

@router.post("", response=AssetSchema)
def create_asset(request, payload: AssetInSchema):
    data = payload.dict(exclude_unset=True)
    data.pop('id', None)
    data.pop('created_at', None)
    data.pop('updated_at', None)
    asset = Asset.objects.create(**data)
    return asset

@router.patch("/{asset_id}", response=AssetSchema)
def update_asset(request, asset_id: int, payload: AssetInSchema):
    asset = get_object_or_404(Asset, id=asset_id)
    data = payload.dict(exclude_unset=True)
    data.pop('id', None)
    data.pop('created_at', None)
    data.pop('updated_at', None)
    for attr, value in data.items():
        setattr(asset, attr, value)
    asset.save()
    return asset

@router.delete("/{asset_id}")
@require_admin
def delete_asset(request, asset_id: int):
    asset = get_object_or_404(Asset, id=asset_id)
    asset.delete()
    return {"success": True}

# ─── Sub-action endpoints ──────────────────────────────────────────────────────

class ReassignPayload(Schema):
    assigneeId: Optional[str] = None
    notes: Optional[str] = None

@router.post("/{asset_id}/reassign", response=AssetSchema)
def reassign_asset(request, asset_id: int, payload: ReassignPayload):
    asset = get_object_or_404(Asset, id=asset_id)
    prev_assignee = asset.assigned_to
    if payload.assigneeId:
        try:
            emp_id = int(payload.assigneeId)
            employee = get_object_or_404(Employee, id=emp_id)
            asset.assigned_to = employee
            if asset.status in ["IN_STOCK", "UNASSIGNED", "STORED", "NEW", "RETIRED"]:
                asset.status = "ACTIVE"
        except (ValueError, TypeError):
            asset.assigned_to = None
            if asset.status == "ACTIVE":
                asset.status = "IN_STOCK"
    else:
        asset.assigned_to = None
        if asset.status == "ACTIVE":
            asset.status = "IN_STOCK"
    asset.save()
    AssetHistory.objects.create(
        asset=asset,
        event_type="REASSIGN",
        description=payload.notes or f"Reassigned asset from {prev_assignee} to {asset.assigned_to}",
    )
    OperationLog.objects.create(
        action="UPDATE",
        resource_type="Asset",
        resource_id=str(asset.id),
        details={"event": "reassign", "assignee": payload.assigneeId},
    )
    return asset

class RetirePayload(Schema):
    reason: str
    notes: Optional[str] = None

@router.post("/{asset_id}/retire", response=AssetSchema)
def retire_asset(request, asset_id: int, payload: RetirePayload):
    asset = get_object_or_404(Asset, id=asset_id)
    asset.status = "RETIRED"
    asset.save()
    AssetHistory.objects.create(
        asset=asset,
        event_type="RETIRE",
        description=f"Retired: {payload.reason}. {payload.notes or ''}".strip(),
    )
    OperationLog.objects.create(
        action="UPDATE",
        resource_type="Asset",
        resource_id=str(asset.id),
        details={"event": "retire", "reason": payload.reason},
    )
    return asset

class LogEventPayload(Schema):
    event_type: str
    description: str

@router.post("/{asset_id}/log", response=AssetHistorySchema)
def log_asset_event(request, asset_id: int, payload: LogEventPayload):
    asset = get_object_or_404(Asset, id=asset_id)
    history = AssetHistory.objects.create(
        asset=asset,
        event_type=payload.event_type,
        description=payload.description,
    )
    OperationLog.objects.create(
        action="LOG",
        resource_type="Asset",
        resource_id=str(asset.id),
        details={"event_type": payload.event_type},
    )
    return history
