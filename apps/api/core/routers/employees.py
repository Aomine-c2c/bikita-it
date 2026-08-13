from core.permissions import require_admin
from ninja import Router
from typing import List, Optional, Any
from django.shortcuts import get_object_or_404
from core.models import Employee, Asset, Ticket
from .schemas import EmployeeSchema, EmployeeInSchema

router = Router()

# ─── Core CRUD ────────────────────────────────────────────────────────────────

@router.get("", response=List[EmployeeSchema])
def get_employees(request):
    return list(Employee.objects.select_related('user', 'location').all())

@router.get("/{employee_id}", response=EmployeeSchema)
def get_employee(request, employee_id: int):
    return get_object_or_404(Employee, id=employee_id)

@router.post("", response=EmployeeSchema)
def create_employee(request, payload: EmployeeInSchema):
    data = payload.dict(exclude_unset=True)
    data.pop('id', None)
    data.pop('created_at', None)
    data.pop('updated_at', None)
    employee = Employee.objects.create(**data)
    return employee

@router.patch("/{employee_id}", response=EmployeeSchema)
def update_employee(request, employee_id: int, payload: EmployeeInSchema):
    employee = get_object_or_404(Employee, id=employee_id)
    data = payload.dict(exclude_unset=True)
    data.pop('id', None)
    data.pop('created_at', None)
    data.pop('updated_at', None)
    for attr, value in data.items():
        setattr(employee, attr, value)
    employee.save()
    return employee

@router.delete("/{employee_id}")
@require_admin
def delete_employee(request, employee_id: int):
    employee = get_object_or_404(Employee, id=employee_id)
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
