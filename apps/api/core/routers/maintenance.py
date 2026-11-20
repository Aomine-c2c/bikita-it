from datetime import date, timedelta
from typing import List, Optional
from ninja import Router, Schema
from django.shortcuts import get_object_or_404
from core.models import MaintenanceTask
from core.maintenance_seed import BIKITA_MAINTENANCE_TASKS

router = Router(tags=["Maintenance Plan"])

FREQUENCY_DAYS = {
    "Daily": 1,
    "Weekly": 7,
    "Monthly": 30,
    "Quarterly": 90,
    "Semi-annual": 182,
    "Annual": 365,
}


def ensure_seeded() -> None:
    if MaintenanceTask.all_objects.count() == 0:
        MaintenanceTask.objects.bulk_create([
            MaintenanceTask(
                code=code,
                frequency=freq,
                system_asset=system_asset,
                activity=activity,
                procedure=procedure,
                suggested_owner=owner,
                recommended_timing=timing,
                priority=priority,
                evidence_record=evidence,
                status="Not Started",
            )
            for (code, freq, system_asset, activity, procedure, owner, timing, priority, evidence) in BIKITA_MAINTENANCE_TASKS
        ])


class MaintenanceTaskOut(Schema):
    id: int
    code: str
    frequency: str
    system_asset: str
    activity: str
    procedure: str
    suggested_owner: str
    assigned_owner: str
    recommended_timing: str
    priority: str
    evidence_record: str
    status: str
    last_completed: Optional[str] = None
    next_due: Optional[str] = None
    work_order: str
    comments: str

    @staticmethod
    def from_model(t: MaintenanceTask) -> "MaintenanceTaskOut":
        return MaintenanceTaskOut(
            id=t.id,
            code=t.code,
            frequency=t.frequency,
            system_asset=t.system_asset,
            activity=t.activity,
            procedure=t.procedure or "",
            suggested_owner=t.suggested_owner or "",
            assigned_owner=t.assigned_owner or "",
            recommended_timing=t.recommended_timing or "",
            priority=t.priority or "Medium",
            evidence_record=t.evidence_record or "",
            status=t.status or "Not Started",
            last_completed=t.last_completed.isoformat() if t.last_completed else None,
            next_due=t.next_due.isoformat() if t.next_due else None,
            work_order=t.work_order or "",
            comments=t.comments or "",
        )


class MaintenanceTaskIn(Schema):
    code: str
    frequency: str
    system_asset: str
    activity: str
    procedure: str = ""
    suggested_owner: str = ""
    assigned_owner: str = ""
    recommended_timing: str = ""
    priority: str = "Medium"
    evidence_record: str = ""
    status: str = "Not Started"
    last_completed: Optional[str] = None
    next_due: Optional[str] = None
    work_order: str = ""
    comments: str = ""


class MaintenanceTaskPatch(Schema):
    frequency: Optional[str] = None
    system_asset: Optional[str] = None
    activity: Optional[str] = None
    procedure: Optional[str] = None
    suggested_owner: Optional[str] = None
    assigned_owner: Optional[str] = None
    recommended_timing: Optional[str] = None
    priority: Optional[str] = None
    evidence_record: Optional[str] = None
    status: Optional[str] = None
    last_completed: Optional[str] = None
    next_due: Optional[str] = None
    work_order: Optional[str] = None
    comments: Optional[str] = None


def _parse_date(val: Optional[str]) -> Optional[date]:
    if not val:
        return None
    try:
        return date.fromisoformat(val[:10])
    except ValueError:
        return None


@router.get("/", response=List[MaintenanceTaskOut])
def list_maintenance_tasks(request, frequency: Optional[str] = None, status: Optional[str] = None, priority: Optional[str] = None):
    ensure_seeded()
    qs = MaintenanceTask.objects.all()
    if frequency:
        qs = qs.filter(frequency=frequency)
    if status:
        qs = qs.filter(status=status)
    if priority:
        qs = qs.filter(priority=priority)
    return [MaintenanceTaskOut.from_model(t) for t in qs]


@router.post("/", response=MaintenanceTaskOut)
def create_maintenance_task(request, payload: MaintenanceTaskIn):
    task = MaintenanceTask.objects.create(
        code=payload.code.strip().upper(),
        frequency=payload.frequency,
        system_asset=payload.system_asset,
        activity=payload.activity,
        procedure=payload.procedure,
        suggested_owner=payload.suggested_owner,
        assigned_owner=payload.assigned_owner,
        recommended_timing=payload.recommended_timing,
        priority=payload.priority,
        evidence_record=payload.evidence_record,
        status=payload.status,
        last_completed=_parse_date(payload.last_completed),
        next_due=_parse_date(payload.next_due),
        work_order=payload.work_order,
        comments=payload.comments,
    )
    return MaintenanceTaskOut.from_model(task)


@router.patch("/{task_id}", response=MaintenanceTaskOut)
def update_maintenance_task(request, task_id: int, payload: MaintenanceTaskPatch):
    task = get_object_or_404(MaintenanceTask, id=task_id)
    data = payload.dict(exclude_unset=True)
    for field, val in data.items():
        if field in ("last_completed", "next_due"):
            setattr(task, field, _parse_date(val))
        else:
            setattr(task, field, val)
    task.save()
    return MaintenanceTaskOut.from_model(task)


@router.post("/{task_id}/complete", response=MaintenanceTaskOut)
def complete_maintenance_task(request, task_id: int):
    task = get_object_or_404(MaintenanceTask, id=task_id)
    today = date.today()
    task.status = "Completed"
    task.last_completed = today
    days = FREQUENCY_DAYS.get(task.frequency)
    task.next_due = today + timedelta(days=days) if days else None
    task.save()
    return MaintenanceTaskOut.from_model(task)


@router.delete("/{task_id}")
def delete_maintenance_task(request, task_id: int):
    task = get_object_or_404(MaintenanceTask, id=task_id)
    task.delete()
    return {"deleted": True, "id": task_id}
