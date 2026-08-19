from core.permissions import require_admin
from ninja import Router, Schema, errors
from typing import List, Optional
from django.shortcuts import get_object_or_404
from core.models import InventoryItem, Asset, Employee, Location, OperationLog
from .schemas import InventoryItemSchema, InventoryItemInSchema
from .utils import safe_fk_id

router = Router()

# ─── Core CRUD ────────────────────────────────────────────────────────────────

@router.get("", response=List[InventoryItemSchema])
def get_inventory(request):
    return list(InventoryItem.objects.all())

@router.get("/{item_id}", response=InventoryItemSchema)
def get_inventory_item(request, item_id: int):
    return get_object_or_404(InventoryItem, id=item_id)

def normalize_inventory_payload(payload_dict: dict) -> dict:
    data = {}
    if "name" in payload_dict and payload_dict["name"] is not None:
        data["name"] = payload_dict["name"]
    if "category" in payload_dict and payload_dict["category"] is not None:
        data["category"] = payload_dict["category"]
    if "quantity" in payload_dict and payload_dict["quantity"] is not None:
        data["quantity"] = payload_dict["quantity"]
    min_stock = payload_dict.get("min_stock") if payload_dict.get("min_stock") is not None else payload_dict.get("minStock")
    if min_stock is not None:
        data["min_stock"] = min_stock
    return data

@router.post("", response=InventoryItemSchema)
def create_inventory_item(request, payload: InventoryItemInSchema):
    raw_data = payload.dict(exclude_unset=True)
    data = normalize_inventory_payload(raw_data)
    item = InventoryItem.objects.create(**data)
    return item

@router.patch("/{item_id}", response=InventoryItemSchema)
def update_inventory_item(request, item_id: int, payload: InventoryItemInSchema):
    item = get_object_or_404(InventoryItem, id=item_id)
    raw_data = payload.dict(exclude_unset=True)
    data = normalize_inventory_payload(raw_data)
    for attr, value in data.items():
        setattr(item, attr, value)
    item.save()
    return item

@router.delete("/{item_id}")
@require_admin
def delete_inventory_item(request, item_id: int):
    item = get_object_or_404(InventoryItem, id=item_id)
    item.delete()
    return {"success": True}

# ─── Lifecycle endpoints ───────────────────────────────────────────────────────

class IssueConsumablePayload(Schema):
    consumptionType: str = "Assign to Employee"
    targetId: Optional[str] = None
    quantity: int = 1
    notes: Optional[str] = None
    assignmentType: Optional[str] = None
    useCableMarking: bool = False
    newMeterMark: Optional[int] = None

@router.post("/{item_id}/issue-consumable")
def issue_consumable(request, item_id: int, payload: IssueConsumablePayload):
    """Issue a consumable inventory item — reduces stock and logs the transaction."""
    item = get_object_or_404(InventoryItem, id=item_id)

    # Determine how many units to deduct
    if payload.useCableMarking and payload.newMeterMark is not None:
        curr_mark = getattr(item, 'current_meter_mark', getattr(item, 'currentMeterMark', 0)) or 0
        qty_used = payload.newMeterMark - curr_mark
        if qty_used <= 0:
            raise errors.HttpError(400, "New meter mark must be greater than the current mark.")
        item.quantity = max(0, item.quantity - qty_used)
        item.save()
    else:
        if payload.quantity > item.quantity:
            raise errors.HttpError(400, f"Insufficient stock. Available: {item.quantity}")
        item.quantity -= payload.quantity
        item.save()

    OperationLog.objects.create(
        action="ISSUE",
        resource_type="InventoryItem",
        resource_id=str(item.id),
        details={
            "consumptionType": payload.consumptionType,
            "targetId": payload.targetId,
            "quantity": payload.quantity,
            "notes": payload.notes,
        },
    )
    return {"success": True, "remaining": item.quantity}

class IssueAssetPayload(Schema):
    assigneeId: Optional[str] = None
    notes: Optional[str] = None

@router.post("/{item_id}/issue-asset")
def issue_asset(request, item_id: int, payload: IssueAssetPayload):
    """Convert a Fixed Asset inventory item into a tracked Hardware Asset."""
    item = get_object_or_404(InventoryItem, id=item_id)

    employee = None
    emp_id = safe_fk_id(payload.assigneeId)
    if emp_id:
        employee = Employee.objects.filter(id=emp_id).first()

    # Create a Hardware Asset from this inventory item
    asset = Asset.objects.create(
        name=item.name,
        category=item.category,
        status="ACTIVE",
        assigned_to=employee,
        notes=payload.notes or f"Issued from inventory item #{item.id}",
    )

    # Reduce inventory count
    item.quantity = max(0, item.quantity - 1)
    item.save()

    OperationLog.objects.create(
        action="ISSUE_ASSET",
        resource_type="InventoryItem",
        resource_id=str(item.id),
        details={"asset_id": asset.id, "assignee": payload.assigneeId, "notes": payload.notes},
    )
    return {"success": True, "assetId": asset.id, "remaining": item.quantity}
