import functools
from ninja.errors import HttpError
from core.models import Employee


def _get_role(request) -> str:
    """Return the role for the authenticated user, or raise 403."""
    if not request.user or not request.user.is_authenticated:
        raise HttpError(401, "Authentication required")
    if request.user.is_superuser:
        return "ADMIN"
    try:
        return request.user.employee_profile.role
    except (Employee.DoesNotExist, AttributeError):
        return "EMPLOYEE"


def require_role(*roles):
    """Decorator that enforces one of the given roles on a view function."""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(request, *args, **kwargs):
            role = _get_role(request)
            if role not in roles:
                raise HttpError(403, "Insufficient permissions")
            return func(request, *args, **kwargs)
        return wrapper
    return decorator


# Convenience decorators
require_admin = require_role("ADMIN")
require_technician = require_role("ADMIN", "TECHNICIAN")
