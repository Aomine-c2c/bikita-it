from typing import Any, Optional, Dict
from core.models import OperationLog

def safe_fk_id(val: Any) -> Optional[int]:
    """
    Safely extract an integer ID from various payload representations:
    - Integer: 12 -> 12
    - String: "12" -> 12
    - Nested dictionary: {"id": 12} -> 12
    - Null / Empty / Invalid: None, "", "null", "undefined", [] -> None
    """
    if val in (None, "", "null", "undefined"):
        return None
    if isinstance(val, dict):
        val = val.get("id")
        if val in (None, "", "null", "undefined"):
            return None
    try:
        parsed = int(val)
        return parsed if parsed > 0 else None
    except (ValueError, TypeError):
        return None

def log_operation(
    action: str,
    resource_type: str,
    resource_id: str,
    details: Optional[Dict[str, Any]] = None,
    performed_by: Optional[Any] = None
) -> OperationLog:
    """
    Standardized operation logging helper for system-wide change audits.
    """
    return OperationLog.objects.create(
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        details=details or {},
    )
