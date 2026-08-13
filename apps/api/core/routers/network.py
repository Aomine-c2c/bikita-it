from core.permissions import require_admin
from ninja import Router, Schema
from typing import List, Optional
from django.shortcuts import get_object_or_404
from django.utils import timezone
from core.models import NetworkDevice, Connection, Asset, OperationLog
from .schemas import NetworkDeviceSchema, NetworkDeviceInSchema, ConnectionSchema

router = Router()

# ─── /network CRUD ────────────────────────────────────────────────────────────

@router.get("/network", response=List[NetworkDeviceSchema])
def get_network_devices(request):
    return list(NetworkDevice.objects.select_related('mapped_asset').all())

@router.get("/network/{device_id}", response=NetworkDeviceSchema)
def get_network_device(request, device_id: int):
    return get_object_or_404(NetworkDevice, id=device_id)

@router.post("/network", response=NetworkDeviceSchema)
def create_network_device(request, payload: NetworkDeviceInSchema):
    data = payload.dict(exclude_unset=True)
    data.pop('id', None)
    data.pop('created_at', None)
    data.pop('updated_at', None)
    device = NetworkDevice.objects.create(**data)
    return device

@router.patch("/network/{device_id}", response=NetworkDeviceSchema)
def update_network_device(request, device_id: int, payload: NetworkDeviceInSchema):
    device = get_object_or_404(NetworkDevice, id=device_id)
    data = payload.dict(exclude_unset=True)
    data.pop('id', None)
    data.pop('created_at', None)
    data.pop('updated_at', None)
    for attr, value in data.items():
        setattr(device, attr, value)
    device.save()
    return device

@router.delete("/network/{device_id}")
@require_admin
def delete_network_device(request, device_id: int):
    device = get_object_or_404(NetworkDevice, id=device_id)
    device.delete()
    return {"success": True}

@router.get("/network/{device_id}/ports")
def get_device_ports(request, device_id: int):
    device = get_object_or_404(NetworkDevice, id=device_id)
    connections = Connection.objects.filter(source_device=device).select_related(
        'target_device', 'target_device__mapped_asset'
    )
    conn_list = list(connections)
    ports = []
    for i in range(1, 25):
        conn = next((c for c in conn_list if c.port == str(i)), None)
        if not conn and len(conn_list) >= i:
            conn = conn_list[i - 1]
        if conn:
            target_name = conn.target_device.hostname
            if not target_name and conn.target_device.mapped_asset:
                target_name = conn.target_device.mapped_asset.name
            if not target_name:
                target_name = conn.target_device.mac_address
            ports.append({
                "num": i,
                "status": conn.target_device.status.lower() if conn.target_device.status else "online",
                "speed": conn.speed or "1 Gbps",
                "vlan": f"VLAN {10 if i <= 12 else 20} (Data)",
                "device": target_name,
                "rxMbps": 0.0,
                "txMbps": 0.0,
            })
        else:
            ports.append({
                "num": i,
                "status": "idle",
                "speed": "Off",
                "vlan": f"VLAN {10 if i <= 12 else 20} (Data)",
                "device": "Unconnected",
                "rxMbps": 0.0,
                "txMbps": 0.0,
            })
    return ports

# ─── /devices aliases (frontend uses /devices) ────────────────────────────────

@router.get("/devices", response=List[NetworkDeviceSchema])
def get_devices(request):
    return list(NetworkDevice.objects.filter(is_staged=False).select_related('mapped_asset').all())

@router.get("/devices/{device_id}", response=NetworkDeviceSchema)
def get_device(request, device_id: int):
    return get_object_or_404(NetworkDevice, id=device_id)

@router.post("/devices", response=NetworkDeviceSchema)
def create_device(request, payload: NetworkDeviceSchema):
    device = NetworkDevice.objects.create(**payload.dict(exclude_unset=True))
    return device

@router.patch("/devices/{device_id}", response=NetworkDeviceSchema)
def update_device(request, device_id: int, payload: NetworkDeviceSchema):
    device = get_object_or_404(NetworkDevice, id=device_id)
    for attr, value in payload.dict(exclude_unset=True).items():
        setattr(device, attr, value)
    device.save()
    return device

@router.delete("/devices/{device_id}")
@require_admin
def delete_device(request, device_id: int):
    device = get_object_or_404(NetworkDevice, id=device_id)
    device.delete()
    return {"success": True}

# ─── Discovery endpoints ───────────────────────────────────────────────────────

@router.get("/devices/discovery/staged", response=List[NetworkDeviceSchema])
def get_staged_devices(request):
    """Return devices discovered during a scan but not yet promoted to managed."""
    return list(NetworkDevice.objects.filter(is_staged=True).select_related('mapped_asset').all())

class ScanDevicePayload(Schema):
    ip_address: str
    mac_address: Optional[str] = None
    hostname: Optional[str] = None
    vendor: Optional[str] = None

class ScanPayload(Schema):
    devices: List[ScanDevicePayload]

@router.post("/devices/discovery/scan")
def trigger_scan(request, payload: ScanPayload):
    """Accept a list of discovered devices and stage them."""
    created = 0
    for d in payload.devices:
        if d.mac_address:
            obj, is_new = NetworkDevice.objects.get_or_create(
                mac_address=d.mac_address,
                defaults={
                    "ip_address": d.ip_address,
                    "hostname": d.hostname,
                    "vendor": d.vendor,
                    "is_staged": True,
                    "status": "ONLINE",
                }
            )
            if is_new:
                created += 1
        else:
            NetworkDevice.objects.create(
                ip_address=d.ip_address,
                mac_address=f"00:00:00:00:00:{str(created).zfill(2)}",
                hostname=d.hostname,
                vendor=d.vendor,
                is_staged=True,
                status="ONLINE",
            )
            created += 1
    return {"message": f"Scan complete. {created} new device(s) staged."}

@router.post("/devices/discovery/promote/{device_id}", response=NetworkDeviceSchema)
def promote_device(request, device_id: int):
    """Promote a staged device to a fully managed device."""
    device = get_object_or_404(NetworkDevice, id=device_id)
    device.is_staged = False
    device.save()
    OperationLog.objects.create(
        action="PROMOTE",
        resource_type="NetworkDevice",
        resource_id=str(device.id),
        details={"ip": device.ip_address, "mac": device.mac_address},
    )
    return device

# ─── Connections ───────────────────────────────────────────────────────────────

@router.get("/connections", response=List[ConnectionSchema])
def get_connections(request):
    return list(Connection.objects.select_related('source_device', 'target_device').all())

@router.get("/connections/{conn_id}", response=ConnectionSchema)
def get_connection(request, conn_id: int):
    return get_object_or_404(Connection, id=conn_id)

@router.post("/connections", response=ConnectionSchema)
def create_connection(request, payload: ConnectionSchema):
    conn = Connection.objects.create(**payload.dict(exclude_unset=True))
    return conn

@router.delete("/connections/{conn_id}")
def delete_connection(request, conn_id: int):
    conn = get_object_or_404(Connection, id=conn_id)
    conn.delete()
    return {"success": True}
