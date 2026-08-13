from core.permissions import require_admin
from ninja import Router, Schema
from typing import List, Optional
from django.shortcuts import get_object_or_404
from core.models import Accessory, SoftwareLicense, OperationLog
from .schemas import AccessorySchema, AccessoryInSchema, SoftwareLicenseSchema, SoftwareLicenseInSchema

router = Router()

# ─── Accessories ───────────────────────────────────────────────────────────────

@router.get("/accessories", response=List[AccessorySchema])
def get_accessories(request):
    return list(Accessory.objects.all())

@router.get("/accessories/{accessory_id}", response=AccessorySchema)
def get_accessory(request, accessory_id: int):
    return get_object_or_404(Accessory, id=accessory_id)

@router.post("/accessories", response=AccessorySchema)
def create_accessory(request, payload: AccessoryInSchema):
    data = payload.dict(exclude_unset=True)
    data.pop('id', None)
    data.pop('created_at', None)
    data.pop('updated_at', None)
    acc = Accessory.objects.create(**data)
    return acc

@router.patch("/accessories/{accessory_id}", response=AccessorySchema)
def update_accessory(request, accessory_id: int, payload: AccessoryInSchema):
    acc = get_object_or_404(Accessory, id=accessory_id)
    data = payload.dict(exclude_unset=True)
    data.pop('id', None)
    data.pop('created_at', None)
    data.pop('updated_at', None)
    for attr, value in data.items():
        setattr(acc, attr, value)
    acc.save()
    return acc

@router.delete("/accessories/{accessory_id}")
@require_admin
def delete_accessory(request, accessory_id: int):
    acc = get_object_or_404(Accessory, id=accessory_id)
    acc.delete()
    return {"success": True}

class DispatchPayload(Schema):
    quantity: int
    notes: Optional[str] = None

@router.post("/accessories/{accessory_id}/dispatch", response=AccessorySchema)
def dispatch_accessory(request, accessory_id: int, payload: DispatchPayload):
    """Reduce accessory stock by the given quantity."""
    acc = get_object_or_404(Accessory, id=accessory_id)
    if payload.quantity > acc.stock:
        from ninja.errors import HttpError
        raise HttpError(400, f"Insufficient stock. Available: {acc.stock}")
    acc.stock -= payload.quantity
    acc.save()
    OperationLog.objects.create(
        action="DISPATCH",
        resource_type="Accessory",
        resource_id=str(acc.id),
        details={"quantity": payload.quantity, "notes": payload.notes},
    )
    return acc

class RestockPayload(Schema):
    quantity: int

@router.post("/accessories/{accessory_id}/restock", response=AccessorySchema)
def restock_accessory(request, accessory_id: int, payload: RestockPayload):
    """Increase accessory stock by the given quantity."""
    acc = get_object_or_404(Accessory, id=accessory_id)
    acc.stock += payload.quantity
    acc.save()
    OperationLog.objects.create(
        action="RESTOCK",
        resource_type="Accessory",
        resource_id=str(acc.id),
        details={"quantity": payload.quantity},
    )
    return acc

# ─── Software Licenses ─────────────────────────────────────────────────────────

@router.get("/software/kpis")
def get_software_kpis(request):
    """Return aggregate KPIs for software licenses."""
    licenses = list(SoftwareLicense.objects.all())
    total_seats = sum(l.total_seats for l in licenses)
    assigned_seats = sum(l.assigned_seats for l in licenses)
    expiring_soon = sum(1 for l in licenses if l.status == "EXPIRING")
    expired = sum(1 for l in licenses if l.status == "EXPIRED")
    return {
        "totalLicenses": len(licenses),
        "totalSeats": total_seats,
        "assignedSeats": assigned_seats,
        "availableSeats": total_seats - assigned_seats,
        "expiringSoon": expiring_soon,
        "expired": expired,
        "utilizationPct": round((assigned_seats / total_seats * 100) if total_seats > 0 else 0, 1),
    }

@router.get("/software", response=List[SoftwareLicenseSchema])
def get_software(request):
    return list(SoftwareLicense.objects.all())

@router.get("/software/{software_id}", response=SoftwareLicenseSchema)
def get_software_license(request, software_id: int):
    return get_object_or_404(SoftwareLicense, id=software_id)

@router.post("/software", response=SoftwareLicenseSchema)
def create_software(request, payload: SoftwareLicenseInSchema):
    data = payload.dict(exclude_unset=True)
    data.pop('id', None)
    data.pop('created_at', None)
    data.pop('updated_at', None)
    sw = SoftwareLicense.objects.create(**data)
    return sw

@router.patch("/software/{software_id}", response=SoftwareLicenseSchema)
def update_software(request, software_id: int, payload: SoftwareLicenseInSchema):
    sw = get_object_or_404(SoftwareLicense, id=software_id)
    data = payload.dict(exclude_unset=True)
    data.pop('id', None)
    data.pop('created_at', None)
    data.pop('updated_at', None)
    for attr, value in data.items():
        setattr(sw, attr, value)
    sw.save()
    return sw

@router.delete("/software/{software_id}")
@require_admin
def delete_software(request, software_id: int):
    sw = get_object_or_404(SoftwareLicense, id=software_id)
    sw.delete()
    return {"success": True}
