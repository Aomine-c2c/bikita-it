import logging
from typing import List, Optional, Any, Dict
from ninja import Router, Schema, errors
from django.shortcuts import get_object_or_404
from django.db import transaction, models
from core.models import (
    Rack, RackMount, PatchPanel, Port, CableLink, Location, Asset, NetworkDevice,
    RackMountOrientation, PortType, PortStatus, CableType, CableColor, OperationLog
)
from core.permissions import require_admin

logger = logging.getLogger(__name__)
router = Router(tags=["Racks & Cabling"])

# --- Schemas ---

class RackIn(Schema):
    location_id: int
    name: str
    total_u: int = 42
    max_power_watts: int = 5000
    max_weight_kg: float = 800.0
    status: str = "ONLINE"
    notes: Optional[str] = ""

class RackOut(Schema):
    id: int
    location_id: int
    location_name: str
    name: str
    total_u: int
    max_power_watts: int
    max_weight_kg: float
    status: str
    notes: str
    occupied_u: int
    u_utilization_pct: float
    total_power_draw_watts: int
    power_utilization_pct: float
    mount_count: int

class RackMountIn(Schema):
    name: str
    start_u: int
    u_height: int = 1
    orientation: str = "FRONT"
    power_draw_watts: int = 150
    asset_id: Optional[int] = None
    device_id: Optional[int] = None
    notes: Optional[str] = ""

class RackMountOut(Schema):
    id: int
    rack_id: int
    name: str
    start_u: int
    u_height: int
    orientation: str
    power_draw_watts: int
    asset_id: Optional[int] = None
    asset_tag: Optional[str] = None
    device_id: Optional[int] = None
    device_ip: Optional[str] = None
    device_type: Optional[str] = None
    notes: str

class SlotOccupation(Schema):
    u_slot: int
    is_occupied: bool
    mount: Optional[RackMountOut] = None

class ElevationOut(Schema):
    rack: RackOut
    slots: List[SlotOccupation]
    mounts: List[RackMountOut]
    unmounted_hardware: List[Dict[str, Any]]

class PatchPanelIn(Schema):
    name: str
    start_u: int = 40
    total_ports: int = 24
    category: str = "Cat6A"

class PortOut(Schema):
    id: int
    patch_panel_id: Optional[int] = None
    device_id: Optional[int] = None
    port_number: int
    port_label: str
    port_type: str
    vlan_id: int
    speed_mbps: int
    status: str
    connected_to: Optional[Dict[str, Any]] = None

class CableLinkIn(Schema):
    source_port_id: int
    target_port_id: int
    cable_type: str = "COPPER"
    color: str = "BLUE"
    length_meters: float = 2.0
    notes: Optional[str] = ""

class CableLinkOut(Schema):
    id: int
    source_port_id: int
    source_port_label: str
    target_port_id: int
    target_port_label: str
    cable_type: str
    color: str
    length_meters: float
    notes: str

# --- Helper Methods ---

def _format_rack(rack: Rack) -> dict:
    mounts = rack.mounts.filter(is_active=True)
    occupied_u = sum(m.u_height for m in mounts)
    total_power = sum(m.power_draw_watts for m in mounts)
    
    u_pct = round((occupied_u / rack.total_u) * 100.0, 1) if rack.total_u > 0 else 0.0
    power_pct = round((total_power / rack.max_power_watts) * 100.0, 1) if rack.max_power_watts > 0 else 0.0

    return {
        "id": rack.id,
        "location_id": rack.location.id,
        "location_name": rack.location.name,
        "name": rack.name,
        "total_u": rack.total_u,
        "max_power_watts": rack.max_power_watts,
        "max_weight_kg": rack.max_weight_kg,
        "status": rack.status,
        "notes": rack.notes,
        "occupied_u": occupied_u,
        "u_utilization_pct": u_pct,
        "total_power_draw_watts": total_power,
        "power_utilization_pct": power_pct,
        "mount_count": mounts.count(),
    }

def _format_mount(mount: RackMount) -> dict:
    return {
        "id": mount.id,
        "rack_id": mount.rack.id,
        "name": mount.name,
        "start_u": mount.start_u,
        "u_height": mount.u_height,
        "orientation": mount.orientation,
        "power_draw_watts": mount.power_draw_watts,
        "asset_id": mount.asset.id if mount.asset else None,
        "asset_tag": mount.asset.asset_tag if mount.asset else None,
        "device_id": mount.device.id if mount.device else None,
        "device_ip": mount.device.ip_address if mount.device else None,
        "device_type": mount.device.device_type if mount.device else None,
        "notes": mount.notes,
    }

# --- Routes ---

@router.post("/cables/link", response=CableLinkOut)
@require_admin
def link_cable(request, payload: CableLinkIn):
    """Connect two ports with a physical cable."""
    p1 = get_object_or_404(Port, id=payload.source_port_id)
    p2 = get_object_or_404(Port, id=payload.target_port_id)

    if p1.id == p2.id:
        raise errors.HttpError(400, "Cannot link a port to itself.")

    # Remove existing active cable on either port
    CableLink.objects.filter(
        models.Q(source_port=p1) | models.Q(target_port=p1) | models.Q(source_port=p2) | models.Q(target_port=p2)
    ).update(is_active=False)

    cable = CableLink.objects.create(
        source_port=p1,
        target_port=p2,
        cable_type=payload.cable_type or CableType.COPPER,
        color=payload.color or CableColor.BLUE,
        length_meters=payload.length_meters,
        notes=payload.notes or "",
    )

    p1.status = PortStatus.CONNECTED
    p1.save()
    p2.status = PortStatus.CONNECTED
    p2.save()

    return {
        "id": cable.id,
        "source_port_id": p1.id,
        "source_port_label": p1.port_label,
        "target_port_id": p2.id,
        "target_port_label": p2.port_label,
        "cable_type": cable.cable_type,
        "color": cable.color,
        "length_meters": cable.length_meters,
        "notes": cable.notes,
    }

@router.delete("/cables/unlink/{link_id}")
@require_admin
def unlink_cable(request, link_id: int):
    """Disconnect and remove a cable run."""
    cable = get_object_or_404(CableLink, id=link_id, is_active=True)
    p1 = cable.source_port
    p2 = cable.target_port

    cable.is_active = False
    cable.save()

    p1.status = PortStatus.EMPTY
    p1.save()
    p2.status = PortStatus.EMPTY
    p2.save()

    return {"success": True, "message": "Cable disconnected."}

@router.get("", response=List[RackOut])
def list_racks(request, location_id: Optional[int] = None):
    """List all active server racks with live occupancy and power calculations."""
    qs = Rack.objects.filter(is_active=True).select_related("location").prefetch_related("mounts")
    if location_id:
        qs = qs.filter(location_id=location_id)
    return [_format_rack(r) for r in qs]

@router.post("", response=RackOut)
@require_admin
def create_rack(request, payload: RackIn):
    """Create a new server rack enclosure."""
    loc = get_object_or_404(Location, id=payload.location_id)
    rack = Rack.objects.create(
        location=loc,
        name=payload.name,
        total_u=payload.total_u,
        max_power_watts=payload.max_power_watts,
        max_weight_kg=payload.max_weight_kg,
        status=payload.status,
        notes=payload.notes or "",
    )
    return _format_rack(rack)

@router.get("/{rack_id}/elevation", response=ElevationOut)
def get_rack_elevation(request, rack_id: int):
    """Retrieve the full 1..total_u vertical elevation slot mapping."""
    rack = get_object_or_404(Rack, id=rack_id, is_active=True)
    mounts = rack.mounts.filter(is_active=True).select_related("asset", "device")
    
    formatted_mounts = [_format_mount(m) for m in mounts]
    
    # Build slot occupancy map (42 down to 1)
    slot_occupancy_map: Dict[int, Optional[dict]] = {u: None for u in range(1, rack.total_u + 1)}
    for fm in formatted_mounts:
        for u in range(fm["start_u"], fm["start_u"] + fm["u_height"]):
            if 1 <= u <= rack.total_u:
                slot_occupancy_map[u] = fm

    slots = [
        {"u_slot": u, "is_occupied": slot_occupancy_map[u] is not None, "mount": slot_occupancy_map[u]}
        for u in range(rack.total_u, 0, -1) # U42 down to U1
    ]

    # Available unmounted hardware candidates
    mounted_asset_ids = RackMount.objects.filter(is_active=True, asset__isnull=False).values_list("asset_id", flat=True)
    mounted_device_ids = RackMount.objects.filter(is_active=True, device__isnull=False).values_list("device_id", flat=True)

    unmounted_assets = Asset.objects.filter(is_active=True).exclude(id__in=mounted_asset_ids)[:20]
    unmounted_devices = NetworkDevice.objects.filter(is_active=True, is_staged=False).exclude(id__in=mounted_device_ids)[:20]

    unmounted_hardware = []
    for a in unmounted_assets:
        unmounted_hardware.append({
            "type": "ASSET",
            "id": a.id,
            "name": a.name,
            "category": a.category,
            "asset_tag": a.asset_tag or a.serial_number or f"AST-{a.id}",
            "suggested_u": 2 if "server" in a.name.lower() or "storage" in a.name.lower() else 1,
            "suggested_watts": 350 if "server" in a.name.lower() else 120,
        })
    for d in unmounted_devices:
        unmounted_hardware.append({
            "type": "DEVICE",
            "id": d.id,
            "name": d.hostname or f"Network Device ({d.ip_address})",
            "category": d.device_type,
            "asset_tag": d.ip_address,
            "suggested_u": 1,
            "suggested_watts": 150,
        })

    return {
        "rack": _format_rack(rack),
        "slots": slots,
        "mounts": formatted_mounts,
        "unmounted_hardware": unmounted_hardware,
    }

@router.post("/{rack_id}/mount", response=RackMountOut)
@require_admin
def mount_hardware(request, rack_id: int, payload: RackMountIn):
    """Mount an equipment chassis into specific U-slots with collision validation."""
    rack = get_object_or_404(Rack, id=rack_id, is_active=True)

    if payload.start_u < 1 or (payload.start_u + payload.u_height - 1) > rack.total_u:
        raise errors.HttpError(400, f"U-slot range U{payload.start_u}-U{payload.start_u + payload.u_height - 1} is out of bounds for a {rack.total_u}U rack.")

    # Collision Check
    target_start = payload.start_u
    target_end = payload.start_u + payload.u_height - 1

    existing_mounts = rack.mounts.filter(is_active=True)
    for em in existing_mounts:
        em_start = em.start_u
        em_end = em.start_u + em.u_height - 1
        # Overlap check
        if max(target_start, em_start) <= min(target_end, em_end):
            raise errors.HttpError(400, f"Collision detected! Slot U{em_start}-U{em_end} is already occupied by '{em.name}'.")

    asset = Asset.objects.filter(id=payload.asset_id).first() if payload.asset_id else None
    device = NetworkDevice.objects.filter(id=payload.device_id).first() if payload.device_id else None

    mount = RackMount.objects.create(
        rack=rack,
        asset=asset,
        device=device,
        name=payload.name,
        start_u=payload.start_u,
        u_height=payload.u_height,
        orientation=payload.orientation or RackMountOrientation.FRONT,
        power_draw_watts=payload.power_draw_watts,
        notes=payload.notes or "",
    )

    OperationLog.objects.create(
        action="MOUNT_EQUIPMENT",
        resource_type="RACK_MOUNT",
        resource_id=str(mount.id),
        details={"rack_id": rack.id, "name": mount.name, "start_u": mount.start_u, "u_height": mount.u_height}
    )

    return _format_mount(mount)

@router.delete("/{rack_id}/unmount/{mount_id}")
@require_admin
def unmount_hardware(request, rack_id: int, mount_id: int):
    """Unmount an equipment chassis and free up its U-slots."""
    mount = get_object_or_404(RackMount, id=mount_id, rack_id=rack_id, is_active=True)
    mount.is_active = False
    mount.save()

    OperationLog.objects.create(
        action="UNMOUNT_EQUIPMENT",
        resource_type="RACK_MOUNT",
        resource_id=str(mount.id),
        details={"rack_id": rack_id, "name": mount.name}
    )
    return {"success": True, "message": f"Unmounted '{mount.name}' from U{mount.start_u}."}

@router.get("/{rack_id}/ports")
def get_rack_ports_and_cabling(request, rack_id: int):
    """Get all patch panels, switch ports, and active cable runs for a rack."""
    rack = get_object_or_404(Rack, id=rack_id, is_active=True)
    
    # Patch panels
    patch_panels = rack.patch_panels.filter(is_active=True).prefetch_related("ports")
    panels_data = []
    for p in patch_panels:
        ports_list = []
        for port in p.ports.all():
            # Check outbound/inbound cable
            cable = CableLink.objects.filter(is_active=True).filter(
                models.Q(source_port=port) | models.Q(target_port=port)
            ).select_related("source_port", "target_port").first()

            peer = None
            if cable:
                other_port = cable.target_port if cable.source_port_id == port.id else cable.source_port
                peer = {
                    "cable_id": cable.id,
                    "peer_port_id": other_port.id,
                    "peer_label": other_port.port_label,
                    "cable_type": cable.cable_type,
                    "color": cable.color,
                    "length_m": cable.length_meters,
                }

            ports_list.append({
                "id": port.id,
                "port_number": port.port_number,
                "port_label": port.port_label,
                "port_type": port.port_type,
                "vlan_id": port.vlan_id,
                "speed_mbps": port.speed_mbps,
                "status": port.status,
                "cable": peer,
            })

        panels_data.append({
            "id": p.id,
            "name": p.name,
            "start_u": p.start_u,
            "total_ports": p.total_ports,
            "category": p.category,
            "ports": ports_list,
        })

    # Cable links in this rack
    panel_port_ids = Port.objects.filter(patch_panel__rack=rack).values_list("id", flat=True)
    cables = CableLink.objects.filter(is_active=True).filter(
        models.Q(source_port_id__in=panel_port_ids) | models.Q(target_port_id__in=panel_port_ids)
    ).select_related("source_port", "target_port")

    cables_data = [
        {
            "id": c.id,
            "source_port_id": c.source_port.id,
            "source_port_label": c.source_port.port_label,
            "target_port_id": c.target_port.id,
            "target_port_label": c.target_port.port_label,
            "cable_type": c.cable_type,
            "color": c.color,
            "length_meters": c.length_meters,
            "notes": c.notes,
        }
        for c in cables
    ]

    return {
        "rack_id": rack.id,
        "rack_name": rack.name,
        "patch_panels": panels_data,
        "cables": cables_data,
    }

@router.post("/{rack_id}/patch-panels")
@require_admin
def create_patch_panel(request, rack_id: int, payload: PatchPanelIn):
    """Create a new patch panel and generate its ports."""
    rack = get_object_or_404(Rack, id=rack_id, is_active=True)
    with transaction.atomic():
        panel = PatchPanel.objects.create(
            rack=rack,
            name=payload.name,
            start_u=payload.start_u,
            total_ports=payload.total_ports,
            category=payload.category,
        )
        # Create ports 1..total_ports
        for p_num in range(1, payload.total_ports + 1):
            Port.objects.create(
                patch_panel=panel,
                port_number=p_num,
                port_label=f"P{p_num:02d}",
                port_type=PortType.RJ45,
                status=PortStatus.EMPTY,
            )

    return {"id": panel.id, "name": panel.name, "total_ports": panel.total_ports}
