from core.permissions import require_admin
from ninja import Router
from typing import List
from django.shortcuts import get_object_or_404
from core.models import InventoryItem
from .schemas import InventoryItemSchema

router = Router()

@router.get("", response=List[InventoryItemSchema])
def get_inventory(request):
    return list(InventoryItem.objects.all())

@router.get("/{item_id}", response=InventoryItemSchema)
def get_inventory_item(request, item_id: int):
    return get_object_or_404(InventoryItem, id=item_id)

@router.post("", response=InventoryItemSchema)
def create_inventory_item(request, payload: InventoryItemSchema):
    item = InventoryItem.objects.create(**payload.dict(exclude_unset=True))
    return item

@router.patch("/{item_id}", response=InventoryItemSchema)
def update_inventory_item(request, item_id: int, payload: InventoryItemSchema):
    item = get_object_or_404(InventoryItem, id=item_id)
    for attr, value in payload.dict(exclude_unset=True).items():
        setattr(item, attr, value)
    item.save()
    return item

@router.delete("/{item_id}")
@require_admin
def delete_inventory_item(request, item_id: int):
    item = get_object_or_404(InventoryItem, id=item_id)
    item.delete()
    return {"success": True}
