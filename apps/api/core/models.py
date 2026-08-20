from django.db import models
from django.contrib.auth.models import User
from django.core.validators import RegexValidator
from django.utils import timezone

class ActiveManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)

class TimeStampedSoftDeleteModel(models.Model):
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def delete(self, *args, **kwargs):
        self.is_active = False
        self.save()

class GeneralStatus(models.TextChoices):
    ONLINE = 'ONLINE', 'Online'
    OFFLINE = 'OFFLINE', 'Offline'
    MAINTENANCE = 'MAINTENANCE', 'Maintenance'
    RETIRED = 'RETIRED', 'Retired'
    ACTIVE = 'ACTIVE', 'Active'

class TicketStatus(models.TextChoices):
    NEW = 'NEW', 'New'
    OPEN = 'OPEN', 'Open'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    RESOLVED = 'RESOLVED', 'Resolved'
    CLOSED = 'CLOSED', 'Closed'

class RepairStatus(models.TextChoices):
    SCHEDULED = 'SCHEDULED', 'Scheduled'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'

class LicenseStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active'
    EXPIRING = 'EXPIRING', 'Expiring'
    EXPIRED = 'EXPIRED', 'Expired'

class LoanStatus(models.TextChoices):
    PENDING_APPROVAL = 'PENDING_APPROVAL', 'Pending Approval'
    APPROVED = 'APPROVED', 'Approved'
    CHECKED_OUT = 'CHECKED_OUT', 'Checked Out'
    RETURNED = 'RETURNED', 'Returned'
    OVERDUE = 'OVERDUE', 'Overdue'
    REJECTED = 'REJECTED', 'Rejected'
    CANCELLED = 'CANCELLED', 'Cancelled'

class UserRole(models.TextChoices):
    SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
    HOD = 'HOD', 'Head of Department'
    TECHNICIAN = 'TECHNICIAN', 'Technician'
    EMPLOYEE = 'EMPLOYEE', 'Employee'
    STUDENT = 'STUDENT', 'Student'

class Department(TimeStampedSoftDeleteModel):
    name = models.CharField(max_length=255, unique=True)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    hod = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='headed_departments')
    location = models.ForeignKey('Location', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

class RolePermission(models.Model):
    role = models.CharField(max_length=50, choices=UserRole.choices, db_index=True)
    module = models.CharField(max_length=100, db_index=True) # assets, inventory, tickets, repairs, network, locations, employees, reports, settings
    can_read = models.BooleanField(default=True)
    can_write = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)
    can_approve = models.BooleanField(default=False)

    class Meta:
        unique_together = ('role', 'module')

    def __str__(self):
        return f"{self.role} - {self.module} (R:{self.can_read}, W:{self.can_write}, D:{self.can_delete}, A:{self.can_approve})"

mac_validator = RegexValidator(regex=r'^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$', message='Invalid MAC Address format')

class Location(TimeStampedSoftDeleteModel):
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=100) # e.g. Building, Floor, Room
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    
    def __str__(self):
        return self.name

class Employee(TimeStampedSoftDeleteModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='employee_profile')
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    department_fk = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='members')
    role = models.CharField(max_length=50, choices=UserRole.choices, default=UserRole.EMPLOYEE)
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True)
    
    def __str__(self):
        return f"{self.name} ({self.role})"

class Asset(TimeStampedSoftDeleteModel):
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100, db_index=True)
    status = models.CharField(max_length=50, choices=GeneralStatus.choices, default=GeneralStatus.ACTIVE, db_index=True)
    make = models.CharField(max_length=100, blank=True, null=True)
    model = models.CharField(max_length=100, blank=True, null=True)
    serial_number = models.CharField(max_length=100, blank=True, null=True, unique=True)
    asset_tag = models.CharField(max_length=50, blank=True, null=True, unique=True)
    ip_address = models.GenericIPAddressField(protocol='both', unpack_ipv4=True, blank=True, null=True)
    mac_address = models.CharField(max_length=17, blank=True, null=True, validators=[mac_validator])
    assigned_to = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True)
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True)
    purchase_date = models.DateField(blank=True, null=True)
    warranty_expiry = models.DateField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    specs = models.JSONField(blank=True, null=True, default=dict)
    
    def __str__(self):
        return self.name

class AssetHistory(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name="history")
    event_type = models.CharField(max_length=100)
    description = models.TextField()
    performed_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.event_type} on {self.asset.name}"

class NetworkDevice(TimeStampedSoftDeleteModel):
    ip_address = models.GenericIPAddressField(protocol='both', unpack_ipv4=True)
    mac_address = models.CharField(max_length=17, unique=True, validators=[mac_validator])
    hostname = models.CharField(max_length=255, blank=True, null=True)
    vendor = models.CharField(max_length=255, blank=True, null=True)
    device_type = models.CharField(max_length=50, default="GENERIC", blank=True)
    status = models.CharField(max_length=50, choices=GeneralStatus.choices, default=GeneralStatus.ONLINE, db_index=True)
    last_seen = models.DateTimeField(auto_now=True)
    is_staged = models.BooleanField(default=False)
    mapped_asset = models.ForeignKey(Asset, on_delete=models.SET_NULL, null=True, blank=True)
    latency_ms = models.FloatField(default=0.0, blank=True, null=True)
    last_ping_at = models.DateTimeField(null=True, blank=True)
    consecutive_failures = models.PositiveIntegerField(default=0)
    open_ports = models.JSONField(default=list, blank=True)
    snmp_sys_descr = models.TextField(blank=True, default="")
    os_fingerprint = models.CharField(max_length=255, blank=True, default="")
    monitoring_enabled = models.BooleanField(default=True)
    is_rogue = models.BooleanField(default=False, db_index=True)
    quarantined = models.BooleanField(default=False, db_index=True)
    vlan_id = models.PositiveIntegerField(default=1, blank=True, null=True)

    def __str__(self):
        return f"{self.hostname or self.ip_address} ({self.mac_address})"

class Rack(TimeStampedSoftDeleteModel):
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name="racks")
    name = models.CharField(max_length=255)
    total_u = models.PositiveIntegerField(default=42)
    max_power_watts = models.PositiveIntegerField(default=5000)
    max_weight_kg = models.FloatField(default=800.0)
    status = models.CharField(max_length=50, choices=GeneralStatus.choices, default=GeneralStatus.ONLINE, db_index=True)
    notes = models.TextField(blank=True, default="")

    def __str__(self):
        return f"{self.name} ({self.location.name} - {self.total_u}U)"

class RackMountOrientation(models.TextChoices):
    FRONT = 'FRONT', 'Front'
    REAR = 'REAR', 'Rear'

class RackMount(TimeStampedSoftDeleteModel):
    rack = models.ForeignKey(Rack, on_delete=models.CASCADE, related_name="mounts")
    asset = models.ForeignKey(Asset, on_delete=models.SET_NULL, null=True, blank=True, related_name="rack_mounts")
    device = models.ForeignKey(NetworkDevice, on_delete=models.SET_NULL, null=True, blank=True, related_name="rack_mounts")
    name = models.CharField(max_length=255)
    start_u = models.PositiveIntegerField()
    u_height = models.PositiveIntegerField(default=1)
    orientation = models.CharField(max_length=20, choices=RackMountOrientation.choices, default=RackMountOrientation.FRONT)
    power_draw_watts = models.PositiveIntegerField(default=150)
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ['-start_u']

    def __str__(self):
        return f"{self.name} on {self.rack.name} (U{self.start_u}-U{self.start_u + self.u_height - 1})"

class PatchPanel(TimeStampedSoftDeleteModel):
    rack = models.ForeignKey(Rack, on_delete=models.CASCADE, related_name="patch_panels")
    name = models.CharField(max_length=255)
    start_u = models.PositiveIntegerField(default=40)
    total_ports = models.PositiveIntegerField(default=24)
    category = models.CharField(max_length=50, default="Cat6A")

    def __str__(self):
        return f"{self.name} ({self.total_ports} ports)"

class PortType(models.TextChoices):
    RJ45 = 'RJ45', 'RJ45 Copper'
    SFP_PLUS = 'SFP+', '10G SFP+'
    FIBER_LC = 'FIBER_LC', 'Fiber LC'
    QSFP = 'QSFP', '40G/100G QSFP'

class PortStatus(models.TextChoices):
    CONNECTED = 'CONNECTED', 'Connected'
    EMPTY = 'EMPTY', 'Empty'
    FAULTY = 'FAULTY', 'Faulty'

class Port(models.Model):
    patch_panel = models.ForeignKey(PatchPanel, on_delete=models.CASCADE, null=True, blank=True, related_name="ports")
    device = models.ForeignKey(NetworkDevice, on_delete=models.CASCADE, null=True, blank=True, related_name="ports")
    port_number = models.PositiveIntegerField()
    port_label = models.CharField(max_length=50)
    port_type = models.CharField(max_length=20, choices=PortType.choices, default=PortType.RJ45)
    vlan_id = models.PositiveIntegerField(default=1)
    speed_mbps = models.PositiveIntegerField(default=1000)
    status = models.CharField(max_length=20, choices=PortStatus.choices, default=PortStatus.EMPTY)

    class Meta:
        ordering = ['port_number']

    def __str__(self):
        parent = self.patch_panel.name if self.patch_panel else (self.device.hostname or self.device.ip_address if self.device else "Orphan")
        return f"{parent} Port {self.port_label}"

class CableType(models.TextChoices):
    COPPER = 'COPPER', 'Cat6A Copper'
    FIBER_SINGLE = 'FIBER_SINGLE', 'Single-Mode Fiber (OS2)'
    FIBER_MULTI = 'FIBER_MULTI', 'Multi-Mode Fiber (OM4)'
    DAC = 'DAC', 'Direct Attach Copper (DAC)'

class CableColor(models.TextChoices):
    BLUE = 'BLUE', 'Blue (LAN Data)'
    YELLOW = 'YELLOW', 'Yellow (Single-Mode Fiber)'
    ORANGE = 'ORANGE', 'Orange (Multi-Mode OM1/OM2)'
    AQUA = 'AQUA', 'Aqua (Multi-Mode OM3/OM4)'
    PURPLE = 'PURPLE', 'Purple (Management/iDRAC)'
    BLACK = 'BLACK', 'Black (DAC / Uplink)'
    RED = 'RED', 'Red (Security / CCTV)'

class CableLink(TimeStampedSoftDeleteModel):
    source_port = models.ForeignKey(Port, on_delete=models.CASCADE, related_name="outbound_cables")
    target_port = models.ForeignKey(Port, on_delete=models.CASCADE, related_name="inbound_cables")
    cable_type = models.CharField(max_length=30, choices=CableType.choices, default=CableType.COPPER)
    color = models.CharField(max_length=20, choices=CableColor.choices, default=CableColor.BLUE)
    length_meters = models.FloatField(default=2.0)
    notes = models.CharField(max_length=255, blank=True, default="")

    def __str__(self):
        return f"{self.source_port} <--> {self.target_port} ({self.cable_type} - {self.color})"

class RackAssignment(models.Model):
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name="rack_assignments")
    device = models.OneToOneField(NetworkDevice, on_delete=models.CASCADE, related_name="rack_assignment")
    u_slot = models.IntegerField()
    u_size = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.device} at {self.location} (U{self.u_slot})"

class InventoryItem(TimeStampedSoftDeleteModel):
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100, db_index=True)
    quantity = models.IntegerField(default=0)
    min_stock = models.IntegerField(default=5)

    def __str__(self):
        return self.name

class Ticket(TimeStampedSoftDeleteModel):
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=50, choices=TicketStatus.choices, default=TicketStatus.NEW, db_index=True)
    priority = models.CharField(max_length=50, default='Medium')
    category = models.CharField(max_length=100, default='Other')
    requester = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name="requested_tickets")
    department = models.CharField(max_length=100, blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    asset_id = models.CharField(max_length=100, blank=True, null=True)
    assigned_to = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_tickets")
    due_date = models.DateTimeField(blank=True, null=True)
    
    # Public & Anonymous Reporting fields
    is_anonymous = models.BooleanField(default=False)
    tracking_code = models.CharField(max_length=32, unique=True, null=True, blank=True, db_index=True)
    reporter_name = models.CharField(max_length=255, blank=True, null=True)
    reporter_email = models.EmailField(blank=True, null=True)
    reporter_phone = models.CharField(max_length=50, blank=True, null=True)
    location_details = models.CharField(max_length=255, blank=True, null=True)
    
    def __str__(self):
        return f"{self.title} ({self.tracking_code or self.id})"

class TicketComment(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True)
    content = models.TextField()
    is_internal = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment on {self.ticket.title}"

class Repair(TimeStampedSoftDeleteModel):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name="repairs")
    hardware_id = models.CharField(max_length=100, blank=True, null=True)
    repair_type = models.CharField(max_length=100)
    status = models.CharField(max_length=50, choices=RepairStatus.choices, default=RepairStatus.SCHEDULED, db_index=True)
    scheduled_date = models.DateTimeField(blank=True, null=True)
    completed_date = models.DateTimeField(blank=True, null=True)
    photo_url = models.URLField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    ticket = models.ForeignKey(Ticket, on_delete=models.SET_NULL, null=True, blank=True, related_name='repairs')
    
    def __str__(self):
        return f"Repair {self.repair_type} on {self.asset.name}"

class Camera(TimeStampedSoftDeleteModel):
    name = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(protocol='both', unpack_ipv4=True)
    mac_address = models.CharField(max_length=17, unique=True, blank=True, null=True, validators=[mac_validator])
    vendor = models.CharField(max_length=100, blank=True, null=True)
    model = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=50, choices=GeneralStatus.choices, default=GeneralStatus.ONLINE, db_index=True)
    resolution = models.CharField(max_length=50, blank=True, null=True)
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True)
    
    def __str__(self):
        return self.name

class Connection(models.Model):
    source_device = models.ForeignKey(NetworkDevice, on_delete=models.CASCADE, related_name="outbound_connections")
    target_device = models.ForeignKey(NetworkDevice, on_delete=models.CASCADE, related_name="inbound_connections")
    port = models.CharField(max_length=50, blank=True, null=True)
    speed = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(max_length=50, choices=GeneralStatus.choices, default=GeneralStatus.ACTIVE)

    def __str__(self):
        return f"{self.source_device} -> {self.target_device}"

class KnowledgeArticle(TimeStampedSoftDeleteModel):
    title = models.CharField(max_length=255)
    content = models.TextField()
    tags = models.JSONField(default=list, blank=True, null=True)
    author = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.title

class OperationLog(models.Model):
    action = models.CharField(max_length=100)
    resource_type = models.CharField(max_length=100)
    resource_id = models.CharField(max_length=100)
    details = models.JSONField(blank=True, null=True)
    performed_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} on {self.resource_type} {self.resource_id}"

class Accessory(TimeStampedSoftDeleteModel):
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=100, default="GENERAL")
    stock = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=5)
    location = models.CharField(max_length=255, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.sku})"

class SoftwareLicense(TimeStampedSoftDeleteModel):
    name = models.CharField(max_length=255)
    version = models.CharField(max_length=50, blank=True, null=True)
    vendor = models.CharField(max_length=255, blank=True, null=True)
    total_seats = models.IntegerField(default=1)
    assigned_seats = models.IntegerField(default=0)
    expiry_date = models.DateField(blank=True, null=True)
    license_key = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, choices=LicenseStatus.choices, default=LicenseStatus.ACTIVE, db_index=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} v{self.version}"


class EquipmentLoan(TimeStampedSoftDeleteModel):
    tracking_code = models.CharField(max_length=32, unique=True, db_index=True)
    requester_name = models.CharField(max_length=255)
    requester_email = models.EmailField()
    requester_id = models.CharField(max_length=50)  # Student Registration Number or Staff ID
    requester_phone = models.CharField(max_length=50, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    purpose = models.TextField()
    equipment_category = models.CharField(max_length=100, default='Laptop')
    specific_asset = models.ForeignKey(Asset, null=True, blank=True, on_delete=models.SET_NULL, related_name='loans')
    start_date = models.DateTimeField(default=timezone.now)
    expected_return_date = models.DateTimeField()
    actual_return_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=50, choices=LoanStatus.choices, default=LoanStatus.PENDING_APPROVAL, db_index=True)
    technician_notes = models.TextField(blank=True, null=True)
    approved_by = models.ForeignKey(Employee, null=True, blank=True, on_delete=models.SET_NULL, related_name='approved_loans')

    def __str__(self):
        return f"{self.tracking_code} - {self.equipment_category} ({self.requester_name})"

