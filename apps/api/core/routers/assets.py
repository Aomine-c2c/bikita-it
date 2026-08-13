from core.permissions import require_admin
from ninja import Router
from typing import List
from django.shortcuts import get_object_or_404
from core.models import Asset
from .schemas import AssetSchema

router = Router()

@router.get("", response=List[AssetSchema])
def get_assets(request):
    return list(Asset.objects.select_related('assigned_to', 'location').all())

@router.get("/{asset_id}", response=AssetSchema)
def get_asset(request, asset_id: int):
    return get_object_or_404(Asset, id=asset_id)

@router.post("", response=AssetSchema)
def create_asset(request, payload: AssetSchema):
    asset = Asset.objects.create(**payload.dict(exclude_unset=True))
    return asset

@router.patch("/{asset_id}", response=AssetSchema)
def update_asset(request, asset_id: int, payload: AssetSchema):
    asset = get_object_or_404(Asset, id=asset_id)
    for attr, value in payload.dict(exclude_unset=True).items():
        setattr(asset, attr, value)
    asset.save()
    return asset

@router.delete("/{asset_id}")
@require_admin
def delete_asset(request, asset_id: int):
    asset = get_object_or_404(Asset, id=asset_id)
    asset.delete()
    return {"success": True}
