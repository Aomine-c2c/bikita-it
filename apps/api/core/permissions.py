import functools
from ninja.errors import HttpError
from core.models import Employee, UserRole, RolePermission

# Module default permissions if not configured in DB
DEFAULT_ROLE_PERMISSIONS = {
    UserRole.SUPER_ADMIN: {
        "assets": {"read": True, "write": True, "delete": True, "approve": True},
        "inventory": {"read": True, "write": True, "delete": True, "approve": True},
        "tickets": {"read": True, "write": True, "delete": True, "approve": True},
        "repairs": {"read": True, "write": True, "delete": True, "approve": True},
        "network": {"read": True, "write": True, "delete": True, "approve": True},
        "locations": {"read": True, "write": True, "delete": True, "approve": True},
        "employees": {"read": True, "write": True, "delete": True, "approve": True},
        "reports": {"read": True, "write": True, "delete": True, "approve": True},
        "settings": {"read": True, "write": True, "delete": True, "approve": True},
    },
    UserRole.HOD: {
        "assets": {"read": True, "write": True, "delete": False, "approve": True},
        "inventory": {"read": True, "write": False, "delete": False, "approve": True},
        "tickets": {"read": True, "write": True, "delete": False, "approve": True},
        "repairs": {"read": True, "write": False, "delete": False, "approve": True},
        "network": {"read": True, "write": False, "delete": False, "approve": False},
        "locations": {"read": True, "write": False, "delete": False, "approve": False},
        "employees": {"read": True, "write": False, "delete": False, "approve": True},
        "reports": {"read": True, "write": False, "delete": False, "approve": True},
        "settings": {"read": False, "write": False, "delete": False, "approve": False},
    },
    UserRole.TECHNICIAN: {
        "assets": {"read": True, "write": True, "delete": False, "approve": False},
        "inventory": {"read": True, "write": True, "delete": False, "approve": False},
        "tickets": {"read": True, "write": True, "delete": False, "approve": False},
        "repairs": {"read": True, "write": True, "delete": False, "approve": False},
        "network": {"read": True, "write": True, "delete": False, "approve": False},
        "locations": {"read": True, "write": True, "delete": False, "approve": False},
        "employees": {"read": True, "write": False, "delete": False, "approve": False},
        "reports": {"read": True, "write": False, "delete": False, "approve": False},
        "settings": {"read": False, "write": False, "delete": False, "approve": False},
    },
    UserRole.EMPLOYEE: {
        "assets": {"read": True, "write": False, "delete": False, "approve": False},
        "inventory": {"read": False, "write": False, "delete": False, "approve": False},
        "tickets": {"read": True, "write": True, "delete": False, "approve": False},
        "repairs": {"read": False, "write": False, "delete": False, "approve": False},
        "network": {"read": False, "write": False, "delete": False, "approve": False},
        "locations": {"read": True, "write": False, "delete": False, "approve": False},
        "employees": {"read": True, "write": False, "delete": False, "approve": False},
        "reports": {"read": False, "write": False, "delete": False, "approve": False},
        "settings": {"read": False, "write": False, "delete": False, "approve": False},
    },
    UserRole.STUDENT: {
        "assets": {"read": False, "write": False, "delete": False, "approve": False},
        "inventory": {"read": False, "write": False, "delete": False, "approve": False},
        "tickets": {"read": True, "write": True, "delete": False, "approve": False},
        "repairs": {"read": False, "write": False, "delete": False, "approve": False},
        "network": {"read": False, "write": False, "delete": False, "approve": False},
        "locations": {"read": False, "write": False, "delete": False, "approve": False},
        "employees": {"read": False, "write": False, "delete": False, "approve": False},
        "reports": {"read": False, "write": False, "delete": False, "approve": False},
        "settings": {"read": False, "write": False, "delete": False, "approve": False},
    },
}


def _get_role(request) -> str:
    """Return the role for the authenticated user, or raise 401."""
    if not request.user or not request.user.is_authenticated:
        raise HttpError(401, "Authentication required")
    if request.user.is_superuser:
        return UserRole.SUPER_ADMIN
    try:
        role = request.user.employee_profile.role
        # Normalize legacy 'ADMIN' to 'SUPER_ADMIN'
        if role == "ADMIN":
            return UserRole.SUPER_ADMIN
        return role
    except (Employee.DoesNotExist, AttributeError):
        return UserRole.EMPLOYEE


def check_user_permission(role: str, module: str, action: str = "read") -> bool:
    """Check whether a given role has the requested action on the module."""
    if role == UserRole.SUPER_ADMIN or role == "ADMIN":
        return True

    # Check DB role permission overrides
    try:
        perm = RolePermission.objects.filter(role=role, module=module).first()
        if perm:
            action_map = {
                "read": perm.can_read,
                "write": perm.can_write,
                "delete": perm.can_delete,
                "approve": perm.can_approve,
            }
            return action_map.get(action, False)
    except Exception:
        pass

    # Fallback to defaults
    role_defaults = DEFAULT_ROLE_PERMISSIONS.get(role, {})
    mod_defaults = role_defaults.get(module, {})
    return mod_defaults.get(action, False)


def require_role(*roles):
    """Decorator that enforces one of the given roles on a view function."""
    normalized_roles = set(roles)
    if "ADMIN" in normalized_roles:
        normalized_roles.add(UserRole.SUPER_ADMIN)
    if UserRole.SUPER_ADMIN in normalized_roles:
        normalized_roles.add("ADMIN")

    def decorator(func):
        @functools.wraps(func)
        def wrapper(request, *args, **kwargs):
            role = _get_role(request)
            if role not in normalized_roles and role not in ("SUPER_ADMIN", "ADMIN"):
                raise HttpError(403, f"Insufficient permissions. Required one of: {list(roles)}")
            return func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_permission(module: str, action: str = "read"):
    """Decorator that dynamically evaluates whether user's role has permission for module:action."""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(request, *args, **kwargs):
            role = _get_role(request)
            if not check_user_permission(role, module, action):
                raise HttpError(403, f"Insufficient permissions to {action} in module '{module}'")
            return func(request, *args, **kwargs)
        return wrapper
    return decorator


# Convenience decorators
require_super_admin = require_role(UserRole.SUPER_ADMIN, "ADMIN")
require_admin = require_role(UserRole.SUPER_ADMIN, "ADMIN")
require_hod = require_role(UserRole.SUPER_ADMIN, "ADMIN", UserRole.HOD)
require_technician = require_role(UserRole.SUPER_ADMIN, "ADMIN", UserRole.HOD, UserRole.TECHNICIAN)
require_staff = require_role(UserRole.SUPER_ADMIN, "ADMIN", UserRole.HOD, UserRole.TECHNICIAN, UserRole.EMPLOYEE)
