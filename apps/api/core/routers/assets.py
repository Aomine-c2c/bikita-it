from core.permissions import require_admin
from ninja import Router, Schema
from typing import List, Optional
from django.shortcuts import get_object_or_404
from django.utils import timezone
from core.models import Asset, AssetHistory, Employee, OperationLog
from .schemas import AssetSchema, AssetInSchema, AssetHistorySchema

router = Router()

def normalize_asset_payload(payload_dict: dict) -> dict:
    data = {}
    if "name" in payload_dict and payload_dict["name"] is not None:
        data["name"] = payload_dict["name"]
    if "category" in payload_dict and payload_dict["category"] is not None:
        data["category"] = payload_dict["category"]
    if "status" in payload_dict and payload_dict["status"] is not None:
        data["status"] = payload_dict["status"]
    
    # Make / Manufacturer
    make = payload_dict.get("make") or payload_dict.get("manufacturer")
    if make is not None:
        data["make"] = make
        
    if "model" in payload_dict and payload_dict["model"] is not None:
        data["model"] = payload_dict["model"]
        
    # Serial Number
    serial = payload_dict.get("serial_number") or payload_dict.get("serialNumber")
    if serial is not None:
        data["serial_number"] = serial
        
    # Asset Tag
    tag = payload_dict.get("asset_tag") or payload_dict.get("assetTag") or payload_dict.get("tag")
    if tag is not None:
        data["asset_tag"] = tag
        
    # IP Address
    ip = payload_dict.get("ip_address") or payload_dict.get("ipAddress")
    if ip is not None:
        data["ip_address"] = ip or None
        
    # MAC Address
    mac = payload_dict.get("mac_address") or payload_dict.get("macAddress")
    if mac is not None:
        data["mac_address"] = mac or None
        
    # Purchase Date
    pdate = payload_dict.get("purchase_date") or payload_dict.get("purchaseDate")
    if pdate is not None:
        data["purchase_date"] = pdate or None
        
    # Warranty Expiry
    wdate = payload_dict.get("warranty_expiry") or payload_dict.get("warrantyExpiry")
    if wdate is not None:
        data["warranty_expiry"] = wdate or None
        
    if "notes" in payload_dict and payload_dict["notes"] is not None:
        data["notes"] = payload_dict["notes"]
        
    if "specs" in payload_dict and payload_dict["specs"] is not None:
        data["specs"] = payload_dict["specs"]
        
    # Location
    loc_id = payload_dict.get("location_id") or payload_dict.get("locationId")
    if loc_id is not None:
        try:
            data["location_id"] = int(loc_id) if loc_id else None
        except (ValueError, TypeError):
            pass
            
    # Assignee
    assignee_id = payload_dict.get("assigned_to_id") or payload_dict.get("assigneeId")
    if assignee_id is not None:
        try:
            data["assigned_to_id"] = int(assignee_id) if assignee_id else None
        except (ValueError, TypeError):
            pass
            
    return data

# ─── Core CRUD ────────────────────────────────────────────────────────────────

@router.get("", response=List[AssetSchema])
def get_assets(request):
    return list(Asset.objects.select_related('assigned_to', 'location').all())

@router.get("/{asset_id}", response=AssetSchema)
def get_asset(request, asset_id: int):
    return get_object_or_404(Asset, id=asset_id)

@router.post("", response=AssetSchema)
def create_asset(request, payload: AssetInSchema):
    raw_data = payload.dict(exclude_unset=True)
    data = normalize_asset_payload(raw_data)
    asset = Asset.objects.create(**data)
    return asset

@router.patch("/{asset_id}", response=AssetSchema)
def update_asset(request, asset_id: int, payload: AssetInSchema):
    asset = get_object_or_404(Asset, id=asset_id)
    raw_data = payload.dict(exclude_unset=True)
    data = normalize_asset_payload(raw_data)
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
