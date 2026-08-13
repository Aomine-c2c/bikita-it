from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
import json
from .models import Asset, Ticket, Employee, OperationLog

def create_log(action, resource_type, resource_id, details=None):
    OperationLog.objects.create(
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        details=details or {},
        performed_by=None  # In a real app we'd grab this from middleware/request context
    )

@receiver(post_save, sender=Asset)
def log_asset_save(sender, instance, created, **kwargs):
    action = "Created" if created else "Updated"
    create_log(action, "Asset", instance.id, {"name": instance.name, "status": instance.status})

@receiver(post_delete, sender=Asset)
def log_asset_delete(sender, instance, **kwargs):
    create_log("Deleted", "Asset", instance.id, {"name": instance.name})

@receiver(post_save, sender=Ticket)
def log_ticket_save(sender, instance, created, **kwargs):
    action = "Created" if created else "Updated"
    create_log(action, "Ticket", instance.id, {"title": instance.title, "status": getattr(instance, 'status', 'Unknown')})

@receiver(post_delete, sender=Ticket)
def log_ticket_delete(sender, instance, **kwargs):
    create_log("Deleted", "Ticket", instance.id, {"title": instance.title})

@receiver(post_save, sender=Employee)
def log_employee_save(sender, instance, created, **kwargs):
    action = "Created" if created else "Updated"
    create_log(action, "Employee", instance.id, {"name": instance.name, "role": instance.role})

@receiver(post_delete, sender=Employee)
def log_employee_delete(sender, instance, **kwargs):
    create_log("Deleted", "Employee", instance.id, {"name": instance.name})
