from core.permissions import require_admin
from ninja import Router
from typing import List, Optional
from django.shortcuts import get_object_or_404
from ninja import Router, Schema
from core.models import Ticket, TicketComment, Repair, Employee, OperationLog
from .schemas import TicketSchema, TicketInSchema, TicketCommentSchema, RepairSchema, RepairInSchema

router = Router()

# ─── Tickets ───────────────────────────────────────────────────────────────────

@router.get("/tickets", response=List[TicketSchema])
def get_tickets(request):
    return list(Ticket.objects.select_related('assigned_to').prefetch_related('repairs').all())

@router.get("/tickets/{ticket_id}", response=TicketSchema)
def get_ticket(request, ticket_id: int):
    return get_object_or_404(Ticket, id=ticket_id)

@router.post("/tickets", response=TicketSchema)
def create_ticket(request, payload: TicketInSchema):
    data = payload.dict(exclude_unset=True)
    data.pop('id', None)
    data.pop('created_at', None)
    data.pop('updated_at', None)
    data.pop('repairIds', None)
    ticket = Ticket.objects.create(**data)
    return ticket

@router.patch("/tickets/{ticket_id}", response=TicketSchema)
def update_ticket(request, ticket_id: int, payload: TicketInSchema):
    ticket = get_object_or_404(Ticket, id=ticket_id)
    data = payload.dict(exclude_unset=True)
    data.pop('id', None)
    data.pop('created_at', None)
    data.pop('updated_at', None)
    data.pop('repairIds', None)
    for attr, value in data.items():
        setattr(ticket, attr, value)
    ticket.save()
    return ticket

@router.delete("/tickets/{ticket_id}")
@require_admin
def delete_ticket(request, ticket_id: int):
    ticket = get_object_or_404(Ticket, id=ticket_id)
    ticket.delete()
    return {"success": True}

# ─── Ticket assign ─────────────────────────────────────────────────────────────

class AssignTicketPayload(Schema):
    assigneeId: Optional[int] = None

@router.post("/tickets/{ticket_id}/assign", response=TicketSchema)
def assign_ticket(request, ticket_id: int, payload: AssignTicketPayload):
    ticket = get_object_or_404(Ticket, id=ticket_id)
    if payload.assigneeId:
        employee = get_object_or_404(Employee, id=payload.assigneeId)
        ticket.assigned_to = employee
    else:
        ticket.assigned_to = None
    ticket.save()
    OperationLog.objects.create(
        action="ASSIGN",
        resource_type="Ticket",
        resource_id=str(ticket.id),
        details={"assignee": payload.assigneeId},
    )
    return ticket

# ─── Comments ──────────────────────────────────────────────────────────────────

@router.get("/tickets/{ticket_id}/comments", response=List[TicketCommentSchema])
def get_ticket_comments(request, ticket_id: int):
    return list(TicketComment.objects.select_related('ticket', 'author').filter(ticket_id=ticket_id))

@router.post("/tickets/{ticket_id}/comments", response=TicketCommentSchema)
def add_comment(request, ticket_id: int, payload: TicketCommentSchema):
    ticket = get_object_or_404(Ticket, id=ticket_id)
    data = payload.dict(exclude_unset=True)
    data.pop('id', None)
    data.pop('created_at', None)
    data.pop('updated_at', None)
    comment = TicketComment.objects.create(ticket=ticket, **data)
    return comment

# ─── Create repair from ticket ─────────────────────────────────────────────────

class CreateRepairPayload(Schema):
    repair_type: str = ""
    cost: float = 0.0
    status: str = "SCHEDULED"
    notes: Optional[str] = None

@router.post("/tickets/{ticket_id}/create-repair", response=RepairSchema)
def create_repair_from_ticket(request, ticket_id: int, payload: CreateRepairPayload):
    ticket = get_object_or_404(Ticket, id=ticket_id)
    repair = Repair.objects.create(
        asset_id=ticket.asset_id,
        ticket=ticket,
        **payload.dict(exclude_unset=True)
    )
    return repair

# ─── Repairs ───────────────────────────────────────────────────────────────────

@router.get("/repairs", response=List[RepairSchema])
def get_repairs(request):
    return list(Repair.objects.select_related('asset', 'ticket').all())

@router.get("/repairs/{repair_id}", response=RepairSchema)
def get_repair(request, repair_id: int):
    return get_object_or_404(Repair, id=repair_id)

@router.post("/repairs", response=RepairSchema)
def create_repair(request, payload: RepairInSchema):
    data = payload.dict(exclude_unset=True)
    data.pop('id', None)
    data.pop('created_at', None)
    data.pop('updated_at', None)
    data.pop('asset_name', None)
    repair = Repair.objects.create(**data)
    return repair

@router.patch("/repairs/{repair_id}", response=RepairSchema)
def update_repair(request, repair_id: int, payload: RepairInSchema):
    repair = get_object_or_404(Repair, id=repair_id)
    data = payload.dict(exclude_unset=True)
    data.pop('id', None)
    data.pop('created_at', None)
    data.pop('updated_at', None)
    data.pop('asset_name', None)
    for attr, value in data.items():
        setattr(repair, attr, value)
    repair.save()
    return repair

@router.delete("/repairs/{repair_id}")
@require_admin
def delete_repair(request, repair_id: int):
    repair = get_object_or_404(Repair, id=repair_id)
    repair.delete()
    return {"success": True}

class LinkTicketPayload(Schema):
    ticket_id: int

@router.post("/repairs/{repair_id}/link-ticket", response=RepairSchema)
def link_repair_to_ticket(request, repair_id: int, payload: LinkTicketPayload):
    repair = get_object_or_404(Repair, id=repair_id)
    repair.ticket_id = payload.ticket_id
    repair.save()
    return repair
