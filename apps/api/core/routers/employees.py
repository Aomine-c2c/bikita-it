from core.permissions import require_admin
from ninja import Router
from typing import List
from django.shortcuts import get_object_or_404
from core.models import Employee
from .schemas import EmployeeSchema

router = Router()

@router.get("", response=List[EmployeeSchema])
def get_employees(request):
    return list(Employee.objects.select_related('user', 'location').all())

@router.get("/{employee_id}", response=EmployeeSchema)
def get_employee(request, employee_id: int):
    return get_object_or_404(Employee, id=employee_id)

@router.post("", response=EmployeeSchema)
def create_employee(request, payload: EmployeeSchema):
    employee = Employee.objects.create(**payload.dict(exclude_unset=True))
    return employee

@router.patch("/{employee_id}", response=EmployeeSchema)
def update_employee(request, employee_id: int, payload: EmployeeSchema):
    employee = get_object_or_404(Employee, id=employee_id)
    for attr, value in payload.dict(exclude_unset=True).items():
        setattr(employee, attr, value)
    employee.save()
    return employee

@router.delete("/{employee_id}")
@require_admin
def delete_employee(request, employee_id: int):
    employee = get_object_or_404(Employee, id=employee_id)
    employee.delete()
    return {"success": True}
