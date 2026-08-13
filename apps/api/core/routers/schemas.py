from ninja import ModelSchema
from pydantic import BaseModel
from typing import List, Optional, Any
from core.models import (
    Location, Employee, Asset, AssetHistory, NetworkDevice, InventoryItem, 
    Ticket, TicketComment, Repair, Camera, Connection, KnowledgeArticle, 
    OperationLog, Accessory, SoftwareLicense, RackAssignment
)

class LocationSchema(ModelSchema):
    class Meta:
        model = Location
        fields = "__all__"

class LocationInSchema(ModelSchema):
    class Meta:
        model = Location
        fields = "__all__"
        fields_optional = "__all__"

class EmployeeSchema(ModelSchema):
    class Meta:
        model = Employee
        fields = "__all__"

class EmployeeInSchema(ModelSchema):
    class Meta:
        model = Employee
        fields = "__all__"
        fields_optional = "__all__"

class AssetSchema(ModelSchema):
    assigned_to: Optional[EmployeeSchema] = None
    location: Optional[LocationSchema] = None

    class Meta:
        model = Asset
        fields = "__all__"

class AssetInSchema(ModelSchema):
    class Meta:
        model = Asset
        fields = "__all__"
        fields_optional = "__all__"

class AssetHistorySchema(ModelSchema):
    class Meta:
        model = AssetHistory
        fields = "__all__"

class NetworkDeviceSchema(ModelSchema):
    class Meta:
        model = NetworkDevice
        fields = "__all__"

class NetworkDeviceInSchema(ModelSchema):
    class Meta:
        model = NetworkDevice
        fields = "__all__"
        fields_optional = "__all__"

class RackAssignmentSchema(ModelSchema):
    class Meta:
        model = RackAssignment
        fields = "__all__"

class InventoryItemSchema(ModelSchema):
    class Meta:
        model = InventoryItem
        fields = "__all__"

class InventoryItemInSchema(ModelSchema):
    class Meta:
        model = InventoryItem
        fields = "__all__"
        fields_optional = "__all__"

class TicketSchema(ModelSchema):
    repairIds: List[int] = []
    class Meta:
        model = Ticket
        fields = "__all__"

    @staticmethod
    def resolve_repairIds(obj):
        return list(obj.repairs.values_list('id', flat=True))

class TicketInSchema(ModelSchema):
    class Meta:
        model = Ticket
        fields = "__all__"
        fields_optional = "__all__"

class TicketCommentSchema(ModelSchema):
    class Meta:
        model = TicketComment
        fields = "__all__"

class RepairSchema(ModelSchema):
    asset_name: Optional[str] = None
    class Meta:
        model = Repair
        fields = "__all__"

    @staticmethod
    def resolve_asset_name(obj):
        return obj.asset.name if hasattr(obj, 'asset') and obj.asset else None

class RepairInSchema(ModelSchema):
    class Meta:
        model = Repair
        fields = "__all__"
        fields_optional = "__all__"

class CameraSchema(ModelSchema):
    class Meta:
        model = Camera
        fields = "__all__"

class ConnectionSchema(ModelSchema):
    target_device_name: Optional[str] = None
    target_device_status: Optional[str] = None
    class Meta:
        model = Connection
        fields = "__all__"

    @staticmethod
    def resolve_target_device_name(obj):
        if not hasattr(obj, 'target_device') or not obj.target_device:
            return None
        if obj.target_device.hostname:
            return obj.target_device.hostname
        if obj.target_device.mapped_asset:
            return obj.target_device.mapped_asset.name
        return obj.target_device.mac_address

    @staticmethod
    def resolve_target_device_status(obj):
        return obj.target_device.status if hasattr(obj, 'target_device') and obj.target_device else None

class KnowledgeArticleSchema(ModelSchema):
    class Meta:
        model = KnowledgeArticle
        fields = "__all__"

class OperationLogSchema(ModelSchema):
    class Meta:
        model = OperationLog
        fields = "__all__"

class AccessorySchema(ModelSchema):
    class Meta:
        model = Accessory
        fields = "__all__"

class AccessoryInSchema(ModelSchema):
    class Meta:
        model = Accessory
        fields = "__all__"
        fields_optional = "__all__"

class SoftwareLicenseSchema(ModelSchema):
    class Meta:
        model = SoftwareLicense
        fields = "__all__"

class SoftwareLicenseInSchema(ModelSchema):
    class Meta:
        model = SoftwareLicense
        fields = "__all__"
        fields_optional = "__all__"

# Extra schemas for auth/login
class UserSchema(BaseModel):
    id: int
    username: str
    email: str
    first_name: str
    last_name: str

class LoginOut(BaseModel):
    access_token: str
    user: UserSchema

class ErrorOut(BaseModel):
    detail: str

class LoginIn(BaseModel):
    username: str  # Accepts username or email
    password: str

class InitializeSetupSchema(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    email: str
    password: str
    orgName: Optional[str] = None

# Report schemas
class AssetMetricsSchema(BaseModel):
    total_count: int
    total_spend: float
    active_count: int

class TicketMetricsSchema(BaseModel):
    total_count: int
    open_count: int
    resolved_count: int

class NetworkMetricsSchema(BaseModel):
    total_count: int
    active_count: int

class ReportSummarySchema(BaseModel):
    assets: AssetMetricsSchema
    tickets: TicketMetricsSchema
    network: NetworkMetricsSchema
