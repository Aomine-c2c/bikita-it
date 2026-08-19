from core.permissions import require_admin
from ninja import Router
from typing import List, Optional, Any
from django.shortcuts import get_object_or_404
from core.models import Employee, Asset, Ticket
from .schemas import EmployeeSchema, EmployeeInSchema

router = Router()

from .utils import safe_fk_id, log_operation

def normalize_employee_payload(payload_dict: dict) -> dict:
    data = {}
    # Name handling
    if "name" in payload_dict and payload_dict["name"]:
        data["name"] = payload_dict["name"]
    else:
        first = payload_dict.get("first_name") or payload_dict.get("firstName") or ""
        last = payload_dict.get("last_name") or payload_dict.get("lastName") or ""
        combined = f"{first} {last}".strip()
        if combined:
            data["name"] = combined
            
    if "email" in payload_dict and payload_dict["email"]:
        data["email"] = payload_dict["email"]
    if "department" in payload_dict and payload_dict["department"] is not None:
        data["department"] = payload_dict["department"]
    if "role" in payload_dict and payload_dict["role"]:
        data["role"] = payload_dict["role"]
        
    # Location FK
    loc_val = payload_dict.get("location_id") or payload_dict.get("locationId") or payload_dict.get("location")
    if loc_val is not None:
        data["location_id"] = safe_fk_id(loc_val)
        
    return data

# ─── Core CRUD ────────────────────────────────────────────────────────────────

@router.get("", response=List[EmployeeSchema])
def get_employees(request):
    return list(Employee.objects.select_related('user', 'location').all())

@router.get("/{employee_id}", response=EmployeeSchema)
def get_employee(request, employee_id: int):
    return get_object_or_404(Employee.objects.select_related('user', 'location'), id=employee_id)

@router.post("", response=EmployeeSchema)
def create_employee(request, payload: EmployeeInSchema):
    raw_data = payload.dict(exclude_unset=True)
    data = normalize_employee_payload(raw_data)
    employee = Employee.objects.create(**data)
    log_operation(
        action="CREATE",
        resource_type="Employee",
        resource_id=str(employee.id),
        details={"name": employee.name, "email": employee.email, "role": employee.role},
    )
    return employee

@router.patch("/{employee_id}", response=EmployeeSchema)
def update_employee(request, employee_id: int, payload: EmployeeInSchema):
    employee = get_object_or_404(Employee, id=employee_id)
    raw_data = payload.dict(exclude_unset=True)
    data = normalize_employee_payload(raw_data)
    for attr, value in data.items():
        setattr(employee, attr, value)
    employee.save()
    log_operation(
        action="UPDATE",
        resource_type="Employee",
        resource_id=str(employee.id),
        details={"updated_fields": list(data.keys()), "name": employee.name},
    )
    return employee

@router.delete("/{employee_id}")
@require_admin
def delete_employee(request, employee_id: int):
    employee = get_object_or_404(Employee, id=employee_id)
    log_operation(
        action="DELETE",
        resource_type="Employee",
        resource_id=str(employee.id),
        details={"name": employee.name},
    )
    employee.delete()
    return {"success": True}

# ─── Profile endpoint ──────────────────────────────────────────────────────────

@router.get("/{employee_id}/profile")
def get_employee_profile(request, employee_id: int):
    """Return an employee with their assigned assets and open tickets."""
    employee = get_object_or_404(Employee, id=employee_id)
    assets = list(
        Asset.objects.filter(assigned_to=employee)
        .values("id", "name", "category", "status", "asset_tag", "serial_number")
    )
    tickets = list(
        Ticket.objects.filter(requester=employee)
        .values("id", "title", "status", "priority", "created_at")
        .order_by("-created_at")[:10]
    )
    return {
        "id": employee.id,
        "name": employee.name,
        "email": employee.email,
        "department": employee.department,
        "role": employee.role,
        "location": employee.location.name if employee.location else None,
        "assets": assets,
        "tickets": tickets,
        "createdAt": employee.created_at.isoformat() if hasattr(employee, 'created_at') else None,
    }
