from typing import Dict, Any
from django.contrib.auth.models import AbstractUser
from ninja_extra import api_controller, route
from ninja_jwt.controller import NinjaJWTDefaultController
from ninja_jwt.schema import TokenObtainPairInputSchema, TokenObtainPairOutputSchema
from ninja_jwt.tokens import RefreshToken
from core.models import UserRole


class CustomTokenObtainPairInputSchema(TokenObtainPairInputSchema):
    @classmethod
    def get_token(cls, user: Any) -> Dict[str, Any]:
        values: Dict[str, Any] = {}
        refresh: Any = RefreshToken.for_user(user)

        role = UserRole.EMPLOYEE
        dept_name = ""
        dept_code = ""
        full_name = getattr(user, "get_full_name", lambda: "")() or getattr(user, "username", "")

        if getattr(user, "is_superuser", False):
            role = UserRole.SUPER_ADMIN
        elif hasattr(user, 'employee_profile') and user.employee_profile:
            role = user.employee_profile.role
            full_name = user.employee_profile.name or full_name
            if user.employee_profile.department_fk:
                dept_name = user.employee_profile.department_fk.name
                dept_code = user.employee_profile.department_fk.code
            elif user.employee_profile.department:
                dept_name = user.employee_profile.department

        # Normalize legacy ADMIN string
        if role == "ADMIN":
            role = UserRole.SUPER_ADMIN

        refresh['role'] = role
        refresh['name'] = full_name
        refresh['department'] = dept_name
        refresh['department_code'] = dept_code
        refresh.access_token['role'] = role
        refresh.access_token['username'] = getattr(user, "username", "")
        refresh.access_token['name'] = full_name
        refresh.access_token['department'] = dept_name
        refresh.access_token['department_code'] = dept_code

        values["refresh"] = str(refresh)
        values["access"] = str(refresh.access_token)
        return values


@api_controller("/auth", tags=["Auth"])
class CustomAuthController(NinjaJWTDefaultController):
    @route.post("/login", response=TokenObtainPairOutputSchema, url_name="token_obtain_pair")
    def obtain_token(self, user_token: CustomTokenObtainPairInputSchema):
        return getattr(user_token, "to_response")()
