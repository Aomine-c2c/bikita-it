import secrets
import string
from core.permissions import require_admin, require_technician, require_permission
from ninja import Router, errors
from typing import List, Optional, Dict, Any
from django.shortcuts import get_object_or_404
from ninja import Router, Schema
from core.models import Ticket, TicketComment, Repair, Employee, OperationLog
from .schemas import (
    TicketSchema, TicketInSchema, TicketCommentSchema, RepairSchema, RepairInSchema,
    PublicTicketInSchema, PublicTicketOutSchema
)

router = Router()


def _generate_tracking_code() -> str:
    chars = string.ascii_uppercase + string.digits
    for _ in range(10):
        code = "TIK-" + "".join(secrets.choice(chars) for _ in range(6))
        if not Ticket.objects.filter(tracking_code=code).exists():
            return code
    return "TIK-" + "".join(secrets.choice(chars) for _ in range(8))


# ─── Public Anonymous Helpdesk Ticket Submission & Tracking ────────────────────

@router.post("/tickets/public", response=PublicTicketOutSchema, auth=None)
def submit_public_ticket(request, payload: PublicTicketInSchema):
    """Public Helpdesk endpoint for anonymous or unauthenticated users to report an issue."""
    tracking_code = _generate_tracking_code()
    ticket = Ticket.objects.create(
        title=payload.title,
        description=payload.description,
        category=payload.category or "Other",
        priority=payload.priority or "Medium",
        is_anonymous=True,
        tracking_code=tracking_code,
        reporter_name=payload.reporter_name,
        reporter_email=payload.reporter_email,
        reporter_phone=payload.reporter_phone,
        location_details=payload.location_details,
        location=payload.location_details or "",
        asset_id=payload.asset_id or "",
    )

    OperationLog.objects.create(
        action="PUBLIC_SUBMIT",
        resource_type="Ticket",
        resource_id=str(ticket.id),
        details={
            "tracking_code": tracking_code,
            "reporter": payload.reporter_name,
            "email": payload.reporter_email,
        }
    )

    return {
        "id": ticket.id,
        "tracking_code": ticket.tracking_code,
        "title": ticket.title,
        "description": ticket.description,
        "status": ticket.status,
        "priority": ticket.priority,
        "category": ticket.category,
        "reporter_name": ticket.reporter_name,
        "reporter_email": ticket.reporter_email,
        "location_details": ticket.location_details,
        "created_at": ticket.created_at.isoformat(),
        "assigned_to_name": None,
        "comments": [],
    }


@router.get("/tickets/track/{tracking_code}", response=PublicTicketOutSchema, auth=None)
def track_public_ticket(request, tracking_code: str):
    """Public status tracking for anonymous reporters using their unique reference code."""
    ticket = Ticket.objects.filter(tracking_code__iexact=tracking_code.strip()).select_related("assigned_to").first()
    if not ticket:
        raise errors.HttpError(404, f"No ticket found matching tracking code '{tracking_code}'.")

    # Fetch non-internal comments for public display
    comments_qs = TicketComment.objects.filter(ticket=ticket, is_internal=False).select_related("author").order_by("created_at")
    comments = []
    for c in comments_qs:
        author_name = "Support Staff"
        content = c.content
        if c.author:
            author_name = c.author.name
        elif content.startswith("[") and "]: " in content:
            parts = content.split("]: ", 1)
            author_name = parts[0].lstrip("[")
            content = parts[1]
        comments.append({
            "id": c.id,
            "author_name": author_name,
            "content": content,
            "created_at": c.created_at.isoformat(),
        })

    assigned_name = ticket.assigned_to.name if ticket.assigned_to else None

    return {
        "id": ticket.id,
        "tracking_code": ticket.tracking_code,
        "title": ticket.title,
        "description": ticket.description,
        "status": ticket.status,
        "priority": ticket.priority,
        "category": ticket.category,
        "reporter_name": ticket.reporter_name,
        "reporter_email": ticket.reporter_email,
        "location_details": ticket.location_details,
        "created_at": ticket.created_at.isoformat(),
        "assigned_to_name": assigned_name,
        "comments": comments,
    }


class AnonymousCommentIn(Schema):
    content: str
    reporter_name: Optional[str] = None


@router.post("/tickets/track/{tracking_code}/comments", auth=None)
def add_anonymous_ticket_comment(request, tracking_code: str, payload: AnonymousCommentIn):
    """Allow an anonymous reporter to add a note or reply to their tracked ticket."""
    ticket = Ticket.objects.filter(tracking_code__iexact=tracking_code.strip()).first()
    if not ticket:
        raise errors.HttpError(404, f"No ticket found matching tracking code '{tracking_code}'.")

    comment = TicketComment.objects.create(
        ticket=ticket,
        content=f"[{payload.reporter_name or ticket.reporter_name or 'Reporter'}]: {payload.content}",
        is_internal=False,
    )
    return {
        "id": comment.id,
        "content": comment.content,
        "created_at": comment.created_at.isoformat(),
    }


from .utils import safe_fk_id, log_operation

def normalize_ticket_payload(payload_dict: dict) -> dict:
    data = {}
    for key in ["title", "description", "status", "priority", "category", "department", "location"]:
        if key in payload_dict and payload_dict[key] is not None:
            data[key] = payload_dict[key]
            
    # Asset Link
    asset_id = payload_dict.get("asset_id") if payload_dict.get("asset_id") is not None else payload_dict.get("assetId")
    if asset_id is not None:
        data["asset_id"] = str(asset_id) if asset_id else None
        
    # Requester
    requester_val = payload_dict.get("requester_id") if payload_dict.get("requester_id") is not None else payload_dict.get("requesterId")
    if requester_val is not None:
        data["requester_id"] = safe_fk_id(requester_val)
        
    # Assigned To
    assigned_val = payload_dict.get("assigned_to_id") or payload_dict.get("assignedToId") or payload_dict.get("assigneeId")
    if assigned_val is not None:
        data["assigned_to_id"] = safe_fk_id(assigned_val)
        
    # Due Date
    due = payload_dict.get("due_date") if payload_dict.get("due_date") is not None else payload_dict.get("dueDate")
    if due is not None:
        data["due_date"] = due or None
        
    # Public reporter info
    for field, camel in [
        ("is_anonymous", "isAnonymous"),
        ("tracking_code", "trackingCode"),
        ("reporter_name", "reporterName"),
        ("reporter_email", "reporterEmail"),
        ("reporter_phone", "reporterPhone"),
        ("location_details", "locationDetails"),
    ]:
        val = payload_dict.get(field) if payload_dict.get(field) is not None else payload_dict.get(camel)
        if val is not None:
            data[field] = val

    return data


def normalize_repair_payload(payload_dict: dict) -> dict:
    data = {}
    for key in ["status", "description", "issue", "notes", "repair_type", "hardware_id", "photo_url"]:
        if key in payload_dict and payload_dict[key] is not None:
            data[key] = payload_dict[key]
            
    # Repair type alias
    if "repairType" in payload_dict and payload_dict["repairType"] is not None:
        data["repair_type"] = payload_dict["repairType"]
    elif "repair_type" not in data and ("description" in data or "issue" in data):
        data["repair_type"] = data.get("description") or data.get("issue") or "General Repair"
        
    # Hardware ID alias
    if "hardwareId" in payload_dict and payload_dict["hardwareId"] is not None:
        data["hardware_id"] = str(payload_dict["hardwareId"])
        
    # Photo URL alias
    if "photoUrl" in payload_dict and payload_dict["photoUrl"] is not None:
        data["photo_url"] = payload_dict["photoUrl"]
            
    # Asset FK
    asset_val = (
        payload_dict.get("asset_id") if payload_dict.get("asset_id") is not None else 
        payload_dict.get("assetId") or 
        payload_dict.get("asset") or 
        payload_dict.get("hardware_id") or 
        payload_dict.get("hardwareId")
    )
    if asset_val is not None:
        data["asset_id"] = safe_fk_id(asset_val)
        
    # Ticket FK
    ticket_val = (
        payload_dict.get("ticket_id") if payload_dict.get("ticket_id") is not None else 
        payload_dict.get("ticketId") or 
        payload_dict.get("ticket")
    )
    if ticket_val is not None:
        data["ticket_id"] = safe_fk_id(ticket_val)
        
    # Dates
    start = (
        payload_dict.get("scheduled_date") or 
        payload_dict.get("scheduledDate") or 
        payload_dict.get("started_at") or 
        payload_dict.get("startedAt")
    )
    if start is not None:
        data["scheduled_date"] = start or None
        
    comp = (
        payload_dict.get("completed_date") or 
        payload_dict.get("completedDate") or 
        payload_dict.get("completed_at") or 
        payload_dict.get("completedAt")
    )
    if comp is not None:
        data["completed_date"] = comp or None
        
    return data


# ─── Tickets ───────────────────────────────────────────────────────────────────

@router.get("/tickets", response=List[TicketSchema])
def get_tickets(request):
    return list(Ticket.objects.select_related('assigned_to', 'requester').prefetch_related('repairs').all())

@router.get("/tickets/{ticket_id}", response=TicketSchema)
def get_ticket(request, ticket_id: int):
    return get_object_or_404(Ticket.objects.select_related('assigned_to', 'requester').prefetch_related('repairs'), id=ticket_id)

@router.post("/tickets", response=TicketSchema)
def create_ticket(request, payload: TicketInSchema):
    raw_data = payload.dict(exclude_unset=True)
    data = normalize_ticket_payload(raw_data)
    ticket = Ticket.objects.create(**data)
    log_operation(
        action="CREATE",
        resource_type="Ticket",
        resource_id=str(ticket.id),
        details={"title": ticket.title, "priority": ticket.priority, "status": ticket.status},
    )
    return ticket

@router.patch("/tickets/{ticket_id}", response=TicketSchema)
def update_ticket(request, ticket_id: int, payload: TicketInSchema):
    ticket = get_object_or_404(Ticket, id=ticket_id)
    raw_data = payload.dict(exclude_unset=True)
    data = normalize_ticket_payload(raw_data)
    for attr, value in data.items():
        setattr(ticket, attr, value)
    ticket.save()
    log_operation(
        action="UPDATE",
        resource_type="Ticket",
        resource_id=str(ticket.id),
        details={"updated_fields": list(data.keys()), "status": ticket.status},
    )
    return ticket

@router.delete("/tickets/{ticket_id}")
@require_admin
def delete_ticket(request, ticket_id: int):
    ticket = get_object_or_404(Ticket, id=ticket_id)
    log_operation(
        action="DELETE",
        resource_type="Ticket",
        resource_id=str(ticket.id),
        details={"title": ticket.title},
    )
    ticket.delete()
    return {"success": True}

# ─── Ticket assign ─────────────────────────────────────────────────────────────

class AssignTicketPayload(Schema):
    assigneeId: Optional[Any] = None

@router.post("/tickets/{ticket_id}/assign", response=TicketSchema)
def assign_ticket(request, ticket_id: int, payload: AssignTicketPayload):
    ticket = get_object_or_404(Ticket, id=ticket_id)
    assign_id = safe_fk_id(payload.assigneeId)
    if assign_id:
        employee = get_object_or_404(Employee, id=assign_id)
        ticket.assigned_to = employee
    else:
        ticket.assigned_to = None
    ticket.save()
    log_operation(
        action="ASSIGN",
        resource_type="Ticket",
        resource_id=str(ticket.id),
        details={"assignee": assign_id},
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
    log_operation(
        action="COMMENT",
        resource_type="Ticket",
        resource_id=str(ticket.id),
        details={"comment_id": comment.id},
    )
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
    asset_id = safe_fk_id(ticket.asset_id)
    repair = Repair.objects.create(
        asset_id=asset_id,
        ticket=ticket,
        repair_type=payload.repair_type or f"Ticket #{ticket.id} Repair",
        status=payload.status or "SCHEDULED",
        notes=payload.notes or "",
    )
    log_operation(
        action="CREATE_REPAIR",
        resource_type="Ticket",
        resource_id=str(ticket.id),
        details={"repair_id": repair.id},
    )
    return repair

# ─── Repairs ───────────────────────────────────────────────────────────────────

@router.get("/repairs", response=List[RepairSchema])
def get_repairs(request):
    return list(Repair.objects.select_related('asset', 'ticket').all())

@router.get("/repairs/{repair_id}", response=RepairSchema)
def get_repair(request, repair_id: int):
    return get_object_or_404(Repair.objects.select_related('asset', 'ticket'), id=repair_id)

@router.post("/repairs", response=RepairSchema)
def create_repair(request, payload: RepairInSchema):
    raw_data = payload.dict(exclude_unset=True)
    data = normalize_repair_payload(raw_data)
    repair = Repair.objects.create(**data)
    log_operation(
        action="CREATE",
        resource_type="Repair",
        resource_id=str(repair.id),
        details={"status": repair.status, "description": repair.description},
    )
    return repair

@router.patch("/repairs/{repair_id}", response=RepairSchema)
def update_repair(request, repair_id: int, payload: RepairInSchema):
    repair = get_object_or_404(Repair, id=repair_id)
    raw_data = payload.dict(exclude_unset=True)
    data = normalize_repair_payload(raw_data)
    for attr, value in data.items():
        setattr(repair, attr, value)
    repair.save()
    log_operation(
        action="UPDATE",
        resource_type="Repair",
        resource_id=str(repair.id),
        details={"updated_fields": list(data.keys()), "status": repair.status},
    )
    return repair

@router.delete("/repairs/{repair_id}")
@require_admin
def delete_repair(request, repair_id: int):
    repair = get_object_or_404(Repair, id=repair_id)
    log_operation(
        action="DELETE",
        resource_type="Repair",
        resource_id=str(repair.id),
        details={"status": repair.status},
    )
    repair.delete()
    return {"success": True}

class LinkTicketPayload(Schema):
    ticket_id: Any

@router.post("/repairs/{repair_id}/link-ticket", response=RepairSchema)
def link_repair_to_ticket(request, repair_id: int, payload: LinkTicketPayload):
    repair = get_object_or_404(Repair, id=repair_id)
    repair.ticket_id = safe_fk_id(payload.ticket_id)
    repair.save()
    log_operation(
        action="LINK_TICKET",
        resource_type="Repair",
        resource_id=str(repair.id),
        details={"ticket_id": repair.ticket_id},
    )
    return repair
