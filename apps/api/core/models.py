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
    role = models.CharField(max_length=50, default="EMPLOYEE")
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True)
    
    def __str__(self):
        return self.name

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
    status = models.CharField(max_length=50, choices=GeneralStatus.choices, default=GeneralStatus.ONLINE, db_index=True)
    last_seen = models.DateTimeField(auto_now=True)
    is_staged = models.BooleanField(default=False)
    mapped_asset = models.ForeignKey(Asset, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.mac_address

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
    
    def __str__(self):
        return self.title

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
