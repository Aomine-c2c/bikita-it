from ninja import ModelSchema
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from core.models import (
    Location, Employee, Asset, AssetHistory, NetworkDevice, InventoryItem, 
    Ticket, TicketComment, Repair, Camera, Connection, KnowledgeArticle, 
    OperationLog, Accessory, SoftwareLicense, RackAssignment, EquipmentLoan
)

class LocationSchema(ModelSchema):
    class Meta:
        model = Location
        fields = "__all__"

class LocationInSchema(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    address: Optional[str] = None
    capacity: Optional[int] = None
    parent_location: Optional[Any] = None
    parentLocation: Optional[Any] = None
    parent_location_id: Optional[Any] = None
    parentLocationId: Optional[Any] = None
    parentId: Optional[Any] = None

class EmployeeSchema(ModelSchema):
    class Meta:
        model = Employee
        fields = "__all__"

class EmployeeInSchema(BaseModel):
    first_name: Optional[str] = None
    firstName: Optional[str] = None
    last_name: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = None
    phone_number: Optional[str] = None
    phoneNumber: Optional[str] = None
    is_active: Optional[bool] = None
    isActive: Optional[bool] = None

class AssetSchema(ModelSchema):
    assigned_to: Optional[EmployeeSchema] = None
    location: Optional[LocationSchema] = None

    class Meta:
        model = Asset
        fields = "__all__"

class AssetInSchema(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    make: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    serialNumber: Optional[str] = None
    asset_tag: Optional[str] = None
    assetTag: Optional[str] = None
    tag: Optional[str] = None
    ip_address: Optional[str] = None
    ipAddress: Optional[str] = None
    mac_address: Optional[str] = None
    macAddress: Optional[str] = None
    purchase_date: Optional[str] = None
    purchaseDate: Optional[str] = None
    warranty_expiry: Optional[str] = None
    warrantyExpiry: Optional[str] = None
    notes: Optional[str] = None
    specs: Optional[Dict[str, Any]] = None
    location_id: Optional[Any] = None
    locationId: Optional[Any] = None
    assigned_to_id: Optional[Any] = None
    assigneeId: Optional[Any] = None

class AssetHistorySchema(ModelSchema):
    class Meta:
        model = AssetHistory
        fields = "__all__"

class NetworkDeviceSchema(ModelSchema):
    mapped_asset: Optional[AssetSchema] = None

    class Meta:
        model = NetworkDevice
        fields = "__all__"

class NetworkDeviceInSchema(BaseModel):
    ip_address: Optional[str] = None
    ipAddress: Optional[str] = None
    mac_address: Optional[str] = None
    macAddress: Optional[str] = None
    hostname: Optional[str] = None
    vendor: Optional[str] = None
    device_type: Optional[str] = None
    deviceType: Optional[str] = None
    status: Optional[str] = None
    is_staged: Optional[bool] = None
    isStaged: Optional[bool] = None
    mapped_asset_id: Optional[Any] = None
    mappedAssetId: Optional[Any] = None
    open_ports: Optional[List[int]] = None
    openPorts: Optional[List[int]] = None
    snmp_sys_descr: Optional[str] = None
    snmpSysDescr: Optional[str] = None
    os_fingerprint: Optional[str] = None
    osFingerprint: Optional[str] = None
    monitoring_enabled: Optional[bool] = None
    monitoringEnabled: Optional[bool] = None

class RackAssignmentSchema(ModelSchema):
    class Meta:
        model = RackAssignment
        fields = "__all__"

class InventoryItemSchema(ModelSchema):
    class Meta:
        model = InventoryItem
        fields = "__all__"

class InventoryItemInSchema(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    min_stock: Optional[int] = None
    minStock: Optional[int] = None

class TicketSchema(ModelSchema):
    assigned_to: Optional[EmployeeSchema] = None
    requester: Optional[EmployeeSchema] = None
    repairIds: List[int] = []

    class Meta:
        model = Ticket
        fields = "__all__"

    @staticmethod
    def resolve_repairIds(obj):
        return list(obj.repairs.values_list('id', flat=True))

class TicketInSchema(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    asset_id: Optional[Any] = None
    assetId: Optional[Any] = None
    requester_id: Optional[Any] = None
    requesterId: Optional[Any] = None
    assigned_to_id: Optional[Any] = None
    assignedToId: Optional[Any] = None
    assigneeId: Optional[Any] = None
    due_date: Optional[str] = None
    dueDate: Optional[str] = None
    is_anonymous: Optional[bool] = None
    isAnonymous: Optional[bool] = None
    tracking_code: Optional[str] = None
    trackingCode: Optional[str] = None
    reporter_name: Optional[str] = None
    reporterName: Optional[str] = None
    reporter_email: Optional[str] = None
    reporterEmail: Optional[str] = None
    reporter_phone: Optional[str] = None
    reporterPhone: Optional[str] = None
    location_details: Optional[str] = None
    locationDetails: Optional[str] = None

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

class RepairInSchema(BaseModel):
    asset_id: Optional[Any] = None
    assetId: Optional[Any] = None
    asset: Optional[Any] = None
    hardware_id: Optional[Any] = None
    hardwareId: Optional[Any] = None
    ticket_id: Optional[Any] = None
    ticketId: Optional[Any] = None
    ticket: Optional[Any] = None
    repair_type: Optional[str] = None
    repairType: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    issue: Optional[str] = None
    scheduled_date: Optional[str] = None
    scheduledDate: Optional[str] = None
    completed_date: Optional[str] = None
    completedDate: Optional[str] = None
    photo_url: Optional[str] = None
    photoUrl: Optional[str] = None
    notes: Optional[str] = None

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

class AccessoryInSchema(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    stock: Optional[int] = None
    reorder_level: Optional[int] = None
    reorderLevel: Optional[int] = None
    location: Optional[str] = None
    notes: Optional[str] = None

class SoftwareLicenseSchema(ModelSchema):
    class Meta:
        model = SoftwareLicense
        fields = "__all__"

class SoftwareLicenseInSchema(BaseModel):
    name: Optional[str] = None
    version: Optional[str] = None
    vendor: Optional[str] = None
    total_seats: Optional[int] = None
    totalSeats: Optional[int] = None
    assigned_seats: Optional[int] = None
    assignedSeats: Optional[int] = None
    expiry_date: Optional[str] = None
    expiryDate: Optional[str] = None
    license_key: Optional[str] = None
    licenseKey: Optional[str] = None
    status: Optional[str] = None

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

# Dynamic RBAC and Department Schemas
class DepartmentSchema(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str] = None
    hod_name: Optional[str] = None

class DepartmentInSchema(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    hod_id: Optional[int] = None
    location_id: Optional[int] = None

class RolePermissionSchema(BaseModel):
    role: str
    module: str
    can_read: bool
    can_write: bool
    can_delete: bool
    can_approve: bool

class RolePermissionUpdateSchema(BaseModel):
    permissions: List[RolePermissionSchema]

class UserProvisionInSchema(BaseModel):
    username: str
    email: str
    password: str
    name: str
    role: str # SUPER_ADMIN, HOD, TECHNICIAN, EMPLOYEE, STUDENT
    department: Optional[str] = None
    department_id: Optional[int] = None
    location_id: Optional[int] = None

class UserUpdateInSchema(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    department_id: Optional[int] = None
    location_id: Optional[int] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserDetailSchema(BaseModel):
    id: int
    username: str
    email: str
    name: str
    role: str
    department: Optional[str] = None
    department_id: Optional[int] = None
    is_active: bool
    date_joined: str

# Public Helpdesk Ticket Reporting & Tracking Schemas
class PublicTicketInSchema(BaseModel):
    title: str
    description: str
    category: Optional[str] = "Other"
    priority: Optional[str] = "Medium"
    reporter_name: str
    reporter_email: str
    reporter_phone: Optional[str] = None
    location_details: Optional[str] = None
    asset_id: Optional[str] = None

class PublicTicketOutSchema(BaseModel):
    id: int
    tracking_code: str
    title: str
    description: str
    status: str
    priority: str
    category: str
    reporter_name: Optional[str] = None
    reporter_email: Optional[str] = None
    location_details: Optional[str] = None
    created_at: str
    assigned_to_name: Optional[str] = None
    comments: List[Dict[str, Any]] = []

# Operations and Task Automation Schemas
class OperationExecuteInSchema(BaseModel):
    operation_type: str
    operationType: Optional[str] = None
    target_ids: Optional[List[int]] = []
    targetIds: Optional[List[int]] = []
    params: Optional[Dict[str, Any]] = {}
    is_async: Optional[bool] = False
    isAsync: Optional[bool] = False

class OperationJobOutSchema(BaseModel):
    job_id: str
    op_type: str
    status: str
    progress_percent: int
    total_items: int
    processed_items: int
    message: str
    details: Optional[Dict[str, Any]] = {}
    error: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None

class OperationPresetSchema(BaseModel):
    id: str
    name: str
    description: str
    category: str
    icon: str
    recommended_async: bool

# Enterprise Settings & Session Schemas
class UserSessionOutSchema(BaseModel):
    session_id: str
    user_id: int
    username: str
    ip_address: str
    user_agent: str
    device_info: str
    created_at: str
    last_active: str
    is_revoked: bool

class RevokeSessionInSchema(BaseModel):
    session_id: Optional[str] = None

class TestEmailInSchema(BaseModel):
    smtp_server: str
    smtp_port: int = 587
    sender_email: str
    recipient_email: str
    use_tls: bool = True

class TestWebhookInSchema(BaseModel):
    webhook_url: str
    service_type: Optional[str] = "custom"

class TestDiagnosticOutSchema(BaseModel):
    success: bool
    latency_ms: float
    status_code: Optional[int] = None
    message: str
    diagnostic_logs: List[str] = []

class TaxonomyInSchema(BaseModel):
    categories: Optional[List[str]] = None
    locations: Optional[List[str]] = None
    departments: Optional[List[str]] = None
    statuses: Optional[List[str]] = None
    priorities: Optional[List[Dict[str, Any]]] = None

class TaxonomyOutSchema(BaseModel):
    categories: List[str]
    locations: List[str]
    departments: List[str]
    statuses: List[str]
    priorities: List[Dict[str, Any]]


# ─── Student & Staff Portal Schemas ──────────────────────────────────────────

class EquipmentLoanInSchema(BaseModel):
    requester_name: str
    requester_email: str
    requester_id: str
    requester_phone: Optional[str] = None
    department: Optional[str] = None
    purpose: str
    equipment_category: str = "Laptop"
    expected_return_date: str
    start_date: Optional[str] = None


class EquipmentLoanOutSchema(BaseModel):
    id: int
    tracking_code: str
    requester_name: str
    requester_email: str
    requester_id: str
    requester_phone: Optional[str] = None
    department: Optional[str] = None
    purpose: str
    equipment_category: str
    specific_asset_name: Optional[str] = None
    specific_asset_tag: Optional[str] = None
    start_date: str
    expected_return_date: str
    actual_return_date: Optional[str] = None
    status: str
    technician_notes: Optional[str] = None
    created_at: str


class LoanStatusUpdateInSchema(BaseModel):
    status: str
    technician_notes: Optional[str] = None
    asset_id: Optional[int] = None


class AvailableEquipmentCategory(BaseModel):
    category: str
    available_count: int
    icon: str
    description: str


class DiagnosticsPingOutSchema(BaseModel):
    timestamp: str
    server_status: str
    db_latency_ms: float
    cluster_region: str
    active_services: List[Dict[str, str]]


class KnowledgeSuggestOutSchema(BaseModel):
    id: int
    title: str
    category: str
    summary: str
    tags: List[str]
    match_score: float


