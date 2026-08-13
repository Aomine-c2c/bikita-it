from core.permissions import require_admin
from ninja import Router
from typing import List
from django.shortcuts import get_object_or_404
from core.models import NetworkDevice, Connection
from .schemas import NetworkDeviceSchema, ConnectionSchema

router = Router()

# Network Devices
@router.get("/network", response=List[NetworkDeviceSchema])
def get_network_devices(request):
    return list(NetworkDevice.objects.select_related('mapped_asset').all())

@router.get("/network/{device_id}", response=NetworkDeviceSchema)
def get_network_device(request, device_id: int):
    return get_object_or_404(NetworkDevice, id=device_id)

@router.post("/network", response=NetworkDeviceSchema)
def create_network_device(request, payload: NetworkDeviceSchema):
    device = NetworkDevice.objects.create(**payload.dict(exclude_unset=True))
    return device

@router.patch("/network/{device_id}", response=NetworkDeviceSchema)
def update_network_device(request, device_id: int, payload: NetworkDeviceSchema):
    device = get_object_or_404(NetworkDevice, id=device_id)
    for attr, value in payload.dict(exclude_unset=True).items():
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
    # Fetch all outbound connections from this switch
    connections = Connection.objects.filter(source_device=device).select_related('target_device', 'target_device__mapped_asset')
    
    # Map connections by port name. Assuming ports are named '1', '2', 'GigabitEthernet0/1', etc.
    # For the frontend demo, we will map them into a fixed 24 port array.
    conn_list = list(connections)
    ports = []
    
    # We will try to extract an integer port number, otherwise just map sequentially
    for i in range(1, 25):
        # Try to find a connection that explicitly claims this port number
        conn = next((c for c in conn_list if c.port == str(i)), None)
        if not conn and len(conn_list) >= i:
            # Fallback to sequential mapping for the demo if port strings don't exactly match '1', '2'
            conn = conn_list[i-1]
            
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
                "rxMbps": 0.0, # Handled by frontend mock for now
                "txMbps": 0.0
            })
        else:
            ports.append({
                "num": i,
                "status": "idle",
                "speed": "Off",
                "vlan": f"VLAN {10 if i <= 12 else 20} (Data)",
                "device": "Unconnected",
                "rxMbps": 0.0,
                "txMbps": 0.0
            })
            
    return ports

# Connections
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
