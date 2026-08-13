from typing import Dict, Type
from django.contrib.auth.models import AbstractUser
from ninja_extra import api_controller, route
from ninja_jwt.controller import NinjaJWTDefaultController
from ninja_jwt.schema import TokenObtainPairInputSchema, TokenObtainPairOutputSchema, Schema
from ninja_jwt.tokens import RefreshToken

class CustomTokenObtainPairInputSchema(TokenObtainPairInputSchema):
    @classmethod
    def get_token(cls, user: AbstractUser) -> Dict:
        values = {}
        refresh = RefreshToken.for_user(user)
        
        role = "EMPLOYEE"
        if user.is_superuser:
            role = "ADMIN"
        elif hasattr(user, 'employee_profile') and user.employee_profile:
            role = user.employee_profile.role
            
        refresh['role'] = role
        refresh.access_token['role'] = role
        refresh.access_token['username'] = user.username
        
        values["refresh"] = str(refresh)
        values["access"] = str(refresh.access_token)
        return values

@api_controller("/auth", tags=["Auth"])
class CustomAuthController(NinjaJWTDefaultController):
    @route.post("/login", response=TokenObtainPairOutputSchema, url_name="token_obtain_pair")
    def obtain_token(self, user_token: CustomTokenObtainPairInputSchema):
        return user_token.to_response()
