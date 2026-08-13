from core.permissions import require_admin
from ninja import Router
from typing import List
from django.shortcuts import get_object_or_404
from core.models import Accessory, SoftwareLicense
from .schemas import AccessorySchema, SoftwareLicenseSchema

router = Router()

# Accessories
@router.get("/accessories", response=List[AccessorySchema])
def get_accessories(request):
    return list(Accessory.objects.all())

@router.get("/accessories/{accessory_id}", response=AccessorySchema)
def get_accessory(request, accessory_id: int):
    return get_object_or_404(Accessory, id=accessory_id)

@router.post("/accessories", response=AccessorySchema)
def create_accessory(request, payload: AccessorySchema):
    acc = Accessory.objects.create(**payload.dict(exclude_unset=True))
    return acc

@router.patch("/accessories/{accessory_id}", response=AccessorySchema)
def update_accessory(request, accessory_id: int, payload: AccessorySchema):
    acc = get_object_or_404(Accessory, id=accessory_id)
    for attr, value in payload.dict(exclude_unset=True).items():
        setattr(acc, attr, value)
    acc.save()
    return acc

@router.delete("/accessories/{accessory_id}")
@require_admin
def delete_accessory(request, accessory_id: int):
    acc = get_object_or_404(Accessory, id=accessory_id)
    acc.delete()
    return {"success": True}

# Software
@router.get("/software", response=List[SoftwareLicenseSchema])
def get_software(request):
    return list(SoftwareLicense.objects.all())

@router.get("/software/{software_id}", response=SoftwareLicenseSchema)
def get_software_license(request, software_id: int):
    return get_object_or_404(SoftwareLicense, id=software_id)

@router.post("/software", response=SoftwareLicenseSchema)
def create_software(request, payload: SoftwareLicenseSchema):
    sw = SoftwareLicense.objects.create(**payload.dict(exclude_unset=True))
    return sw

@router.patch("/software/{software_id}", response=SoftwareLicenseSchema)
def update_software(request, software_id: int, payload: SoftwareLicenseSchema):
    sw = get_object_or_404(SoftwareLicense, id=software_id)
    for attr, value in payload.dict(exclude_unset=True).items():
        setattr(sw, attr, value)
    sw.save()
    return sw

@router.delete("/software/{software_id}")
@require_admin
def delete_software(request, software_id: int):
    sw = get_object_or_404(SoftwareLicense, id=software_id)
    sw.delete()
    return {"success": True}
