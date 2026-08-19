import threading
import time
import uuid
from typing import Dict, Any, List, Optional
from django.utils import timezone
from django.db import transaction
from core.models import Asset, AssetHistory, InventoryItem, NetworkDevice, Location, Employee, OperationLog
from core.routers.utils import safe_fk_id, log_operation

class OperationJob:
    def __init__(self, job_id: str, op_type: str, total_items: int = 1):
        self.job_id = job_id
        self.op_type = op_type
        self.status = "RUNNING"  # RUNNING, COMPLETED, FAILED, CANCELLED
        self.progress_percent = 0
        self.total_items = total_items
        self.processed_items = 0
        self.message = f"Starting operation {op_type}..."
        self.details: Dict[str, Any] = {}
        self.error: Optional[str] = None
        self.created_at = timezone.now()
        self.completed_at: Optional[Any] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "job_id": self.job_id,
            "op_type": self.op_type,
            "status": self.status,
            "progress_percent": self.progress_percent,
            "total_items": self.total_items,
            "processed_items": self.processed_items,
            "message": self.message,
            "details": self.details,
            "error": self.error,
            "created_at": self.created_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }

OPERATION_JOBS: Dict[str, OperationJob] = {}
OPERATION_LOCK = threading.Lock()

def get_job(job_id: str) -> Optional[OperationJob]:
    with OPERATION_LOCK:
        return OPERATION_JOBS.get(job_id)

def get_all_jobs() -> List[Dict[str, Any]]:
    with OPERATION_LOCK:
        return [job.to_dict() for job in sorted(OPERATION_JOBS.values(), key=lambda j: j.created_at, reverse=True)[:50]]

# ─── Batch Execution Handlers ──────────────────────────────────────────────────

def run_bulk_reassign_assets(asset_ids: List[int], assignee_id: Optional[int], notes: str = "", job: Optional[OperationJob] = None) -> Dict[str, Any]:
    employee = Employee.objects.filter(id=assignee_id).first() if assignee_id else None
    updated = 0
    total = len(asset_ids)

    for idx, aid in enumerate(asset_ids):
        asset = Asset.objects.filter(id=aid).first()
        if asset:
            prev_assigned = asset.assigned_to
            asset.assigned_to = employee
            asset.save()

            AssetHistory.objects.create(
                asset=asset,
                event_type="REASSIGNMENT",
                description=f"Bulk Reassigned to {employee.name if employee else 'Unassigned'}. Notes: {notes}".strip()
            )
            updated += 1

        if job:
            job.processed_items = idx + 1
            job.progress_percent = int(((idx + 1) / max(total, 1)) * 100)
            job.message = f"Reassigned {job.processed_items}/{total} assets..."

    log_operation(
        action="BULK_REASSIGN",
        resource_type="Asset",
        resource_id=f"count:{updated}",
        details={"asset_ids": asset_ids, "assignee_id": assignee_id, "assignee_name": employee.name if employee else None, "notes": notes}
    )

    return {"success": True, "updated_count": updated, "assignee": employee.name if employee else "Unassigned"}

def run_bulk_relocate_assets(asset_ids: List[int], location_id: Optional[int], notes: str = "", job: Optional[OperationJob] = None) -> Dict[str, Any]:
    location = Location.objects.filter(id=location_id).first() if location_id else None
    updated = 0
    total = len(asset_ids)

    for idx, aid in enumerate(asset_ids):
        asset = Asset.objects.filter(id=aid).first()
        if asset:
            asset.location = location
            asset.save()

            AssetHistory.objects.create(
                asset=asset,
                event_type="RELOCATION",
                description=f"Bulk Relocated to {location.name if location else 'No Location'}. Notes: {notes}".strip()
            )
            updated += 1

        if job:
            job.processed_items = idx + 1
            job.progress_percent = int(((idx + 1) / max(total, 1)) * 100)
            job.message = f"Relocated {job.processed_items}/{total} assets..."

    log_operation(
        action="BULK_RELOCATE",
        resource_type="Asset",
        resource_id=f"count:{updated}",
        details={"asset_ids": asset_ids, "location_id": location_id, "location_name": location.name if location else None, "notes": notes}
    )

    return {"success": True, "updated_count": updated, "location": location.name if location else "Unassigned"}

def run_bulk_status_change(asset_ids: List[int], new_status: str, reason: str = "", job: Optional[OperationJob] = None) -> Dict[str, Any]:
    updated = 0
    total = len(asset_ids)

    for idx, aid in enumerate(asset_ids):
        asset = Asset.objects.filter(id=aid).first()
        if asset:
            asset.status = new_status
            asset.save()

            AssetHistory.objects.create(
                asset=asset,
                event_type="STATUS_CHANGE",
                description=f"Bulk Status updated to {new_status}. Reason: {reason}".strip()
            )
            updated += 1

        if job:
            job.processed_items = idx + 1
            job.progress_percent = int(((idx + 1) / max(total, 1)) * 100)
            job.message = f"Updated status on {job.processed_items}/{total} assets..."

    log_operation(
        action="BULK_STATUS_CHANGE",
        resource_type="Asset",
        resource_id=f"count:{updated}",
        details={"asset_ids": asset_ids, "new_status": new_status, "reason": reason}
    )

    return {"success": True, "updated_count": updated, "new_status": new_status}

def run_bulk_restock_inventory(item_ids: List[int], quantity: int, notes: str = "", job: Optional[OperationJob] = None) -> Dict[str, Any]:
    updated = 0
    total = len(item_ids)

    for idx, iid in enumerate(item_ids):
        item = InventoryItem.objects.filter(id=iid).first()
        if item:
            item.quantity += quantity
            item.save()
            updated += 1

        if job:
            job.processed_items = idx + 1
            job.progress_percent = int(((idx + 1) / max(total, 1)) * 100)
            job.message = f"Restocked {job.processed_items}/{total} inventory items..."

    log_operation(
        action="BULK_RESTOCK",
        resource_type="InventoryItem",
        resource_id=f"count:{updated}",
        details={"item_ids": item_ids, "quantity_added": quantity, "notes": notes}
    )

    return {"success": True, "updated_count": updated, "quantity_added": quantity}

def run_diagnostic_sweep(job: Optional[OperationJob] = None) -> Dict[str, Any]:
    """Inspect fleet health, orphan relations, and system statistics."""
    if job:
        job.progress_percent = 20
        job.message = "Auditing hardware assets..."

    total_assets = Asset.objects.count()
    unassigned_assets = Asset.objects.filter(assigned_to__isnull=True).count()
    active_assets = Asset.objects.filter(status="ACTIVE").count()

    if job:
        job.progress_percent = 50
        job.message = "Checking inventory thresholds..."

    total_items = InventoryItem.objects.count()
    low_stock = InventoryItem.objects.filter(quantity__lte=5).count()

    if job:
        job.progress_percent = 80
        job.message = "Polling network infrastructure..."

    total_devices = NetworkDevice.objects.count()
    staged_devices = NetworkDevice.objects.filter(is_staged=True).count()

    if job:
        job.progress_percent = 100
        job.message = "Diagnostic sweep complete."

    summary = {
        "assets": {"total": total_assets, "active": active_assets, "unassigned": unassigned_assets},
        "inventory": {"total": total_items, "low_stock": low_stock},
        "network": {"total": total_devices, "staged": staged_devices},
        "sweep_timestamp": timezone.now().isoformat(),
    }

    log_operation(
        action="DIAGNOSTIC_SWEEP",
        resource_type="System",
        resource_id="fleet_health",
        details=summary
    )

    return summary

# ─── Async Dispatcher ─────────────────────────────────────────────────────────

def execute_operation_async(op_type: str, target_ids: List[int], params: Dict[str, Any]) -> str:
    job_id = f"op-{uuid.uuid4().hex[:8]}"
    job = OperationJob(job_id=job_id, op_type=op_type, total_items=len(target_ids) if target_ids else 1)

    with OPERATION_LOCK:
        OPERATION_JOBS[job_id] = job

    def worker():
        try:
            time.sleep(0.3)  # Gentle dispatch breather
            res = {}
            if op_type == "BULK_REASSIGN_ASSETS":
                assignee_id = safe_fk_id(params.get("assigneeId") or params.get("assignee_id"))
                res = run_bulk_reassign_assets(target_ids, assignee_id, params.get("notes", ""), job)
            elif op_type == "BULK_RELOCATE_ASSETS":
                loc_id = safe_fk_id(params.get("locationId") or params.get("location_id"))
                res = run_bulk_relocate_assets(target_ids, loc_id, params.get("notes", ""), job)
            elif op_type == "BULK_STATUS_CHANGE":
                new_status = params.get("status") or params.get("new_status") or "ACTIVE"
                res = run_bulk_status_change(target_ids, new_status, params.get("reason", ""), job)
            elif op_type == "BULK_RESTOCK":
                qty = int(params.get("quantity", 10))
                res = run_bulk_restock_inventory(target_ids, qty, params.get("notes", ""), job)
            elif op_type == "DIAGNOSTIC_SWEEP":
                res = run_diagnostic_sweep(job)
            else:
                res = {"success": True, "message": f"Operation {op_type} executed"}

            job.status = "COMPLETED"
            job.progress_percent = 100
            job.completed_at = timezone.now()
            job.details = res
            job.message = f"Operation {op_type} completed successfully."
        except Exception as e:
            job.status = "FAILED"
            job.error = str(e)
            job.completed_at = timezone.now()
            job.message = f"Operation failed: {str(e)}"

    thread = threading.Thread(target=worker, daemon=True)
    thread.start()

    return job_id
