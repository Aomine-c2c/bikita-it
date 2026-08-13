from core.permissions import require_admin
from ninja import Router, Schema
from typing import List, Optional
from django.shortcuts import get_object_or_404
from core.models import InventoryItem, Asset, Employee, Location, OperationLog
from .schemas import InventoryItemSchema, InventoryItemInSchema

router = Router()

# ─── Core CRUD ────────────────────────────────────────────────────────────────

@router.get("", response=List[InventoryItemSchema])
def get_inventory(request):
    return list(InventoryItem.objects.all())

@router.get("/{item_id}", response=InventoryItemSchema)
def get_inventory_item(request, item_id: int):
    return get_object_or_404(InventoryItem, id=item_id)

@router.post("", response=InventoryItemSchema)
def create_inventory_item(request, payload: InventoryItemInSchema):
    data = payload.dict(exclude_unset=True)
    data.pop('id', None)
    data.pop('created_at', None)
    data.pop('updated_at', None)
    item = InventoryItem.objects.create(**data)
    return item

@router.patch("/{item_id}", response=InventoryItemSchema)
def update_inventory_item(request, item_id: int, payload: InventoryItemInSchema):
    item = get_object_or_404(InventoryItem, id=item_id)
    data = payload.dict(exclude_unset=True)
    data.pop('id', None)
    data.pop('created_at', None)
    data.pop('updated_at', None)
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
        qty_used = payload.newMeterMark - (item.currentMeterMark or 0)
        if qty_used <= 0:
            return {"error": "New meter mark must be greater than the current mark."}, 400
        item.quantity = max(0, item.quantity - qty_used)
        item.save()
    else:
        if payload.quantity > item.quantity:
            return {"error": f"Insufficient stock. Available: {item.quantity}"}, 400
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
    if payload.assigneeId:
        employee = Employee.objects.filter(id=payload.assigneeId).first()

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
