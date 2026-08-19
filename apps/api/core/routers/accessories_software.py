from core.permissions import require_admin
from ninja import Router, Schema
from typing import List, Optional
from django.shortcuts import get_object_or_404
from core.models import Accessory, SoftwareLicense, OperationLog
from .schemas import AccessorySchema, AccessoryInSchema, SoftwareLicenseSchema, SoftwareLicenseInSchema

router = Router()

from .utils import safe_fk_id, log_operation

def normalize_accessory_payload(payload_dict: dict) -> dict:
    data = {}
    for key in ["name", "sku", "category", "location", "notes"]:
        if key in payload_dict and payload_dict[key] is not None:
            data[key] = payload_dict[key]
    if "stock" in payload_dict and payload_dict["stock"] is not None:
        data["stock"] = int(payload_dict["stock"])
    reorder = payload_dict.get("reorder_level") if payload_dict.get("reorder_level") is not None else payload_dict.get("reorderLevel")
    if reorder is not None:
        data["reorder_level"] = int(reorder)
    return data

def normalize_software_payload(payload_dict: dict) -> dict:
    data = {}
    for key in ["name", "version", "vendor", "status"]:
        if key in payload_dict and payload_dict[key] is not None:
            data[key] = payload_dict[key]
    tot = payload_dict.get("total_seats") if payload_dict.get("total_seats") is not None else payload_dict.get("totalSeats")
    if tot is not None:
        data["total_seats"] = int(tot)
    asgn = payload_dict.get("assigned_seats") if payload_dict.get("assigned_seats") is not None else payload_dict.get("assignedSeats")
    if asgn is not None:
        data["assigned_seats"] = int(asgn)
    exp = payload_dict.get("expiry_date") if payload_dict.get("expiry_date") is not None else payload_dict.get("expiryDate")
    if exp is not None:
        data["expiry_date"] = exp or None
    key_val = payload_dict.get("license_key") if payload_dict.get("license_key") is not None else payload_dict.get("licenseKey")
    if key_val is not None:
        data["license_key"] = key_val
    return data

# ─── Accessories ───────────────────────────────────────────────────────────────

@router.get("/accessories", response=List[AccessorySchema])
def get_accessories(request):
    return list(Accessory.objects.all())

@router.get("/accessories/{accessory_id}", response=AccessorySchema)
def get_accessory(request, accessory_id: int):
    return get_object_or_404(Accessory, id=accessory_id)

@router.post("/accessories", response=AccessorySchema)
def create_accessory(request, payload: AccessoryInSchema):
    raw_data = payload.dict(exclude_unset=True)
    data = normalize_accessory_payload(raw_data)
    acc = Accessory.objects.create(**data)
    log_operation(
        action="CREATE",
        resource_type="Accessory",
        resource_id=str(acc.id),
        details={"name": acc.name, "sku": acc.sku, "stock": acc.stock},
    )
    return acc

@router.patch("/accessories/{accessory_id}", response=AccessorySchema)
def update_accessory(request, accessory_id: int, payload: AccessoryInSchema):
    acc = get_object_or_404(Accessory, id=accessory_id)
    raw_data = payload.dict(exclude_unset=True)
    data = normalize_accessory_payload(raw_data)
    for attr, value in data.items():
        setattr(acc, attr, value)
    acc.save()
    log_operation(
        action="UPDATE",
        resource_type="Accessory",
        resource_id=str(acc.id),
        details={"updated_fields": list(data.keys()), "stock": acc.stock},
    )
    return acc

@router.delete("/accessories/{accessory_id}")
@require_admin
def delete_accessory(request, accessory_id: int):
    acc = get_object_or_404(Accessory, id=accessory_id)
    log_operation(
        action="DELETE",
        resource_type="Accessory",
        resource_id=str(acc.id),
        details={"name": acc.name},
    )
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
    log_operation(
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
    log_operation(
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
    raw_data = payload.dict(exclude_unset=True)
    data = normalize_software_payload(raw_data)
    sw = SoftwareLicense.objects.create(**data)
    log_operation(
        action="CREATE",
        resource_type="SoftwareLicense",
        resource_id=str(sw.id),
        details={"name": sw.name, "vendor": sw.vendor, "total_seats": sw.total_seats},
    )
    return sw

@router.patch("/software/{software_id}", response=SoftwareLicenseSchema)
def update_software(request, software_id: int, payload: SoftwareLicenseInSchema):
    sw = get_object_or_404(SoftwareLicense, id=software_id)
    raw_data = payload.dict(exclude_unset=True)
    data = normalize_software_payload(raw_data)
    for attr, value in data.items():
        setattr(sw, attr, value)
    sw.save()
    log_operation(
        action="UPDATE",
        resource_type="SoftwareLicense",
        resource_id=str(sw.id),
        details={"updated_fields": list(data.keys()), "name": sw.name},
    )
    return sw

@router.delete("/software/{software_id}")
@require_admin
def delete_software(request, software_id: int):
    sw = get_object_or_404(SoftwareLicense, id=software_id)
    log_operation(
        action="DELETE",
        resource_type="SoftwareLicense",
        resource_id=str(sw.id),
        details={"name": sw.name},
    )
    sw.delete()
    return {"success": True}
