from core.permissions import require_admin
from ninja import Router, Schema
from typing import List, Optional
from django.shortcuts import get_object_or_404
from django.utils import timezone
from core.models import NetworkDevice, Connection, Asset, OperationLog, Location, Department, Ticket
from .schemas import (
    NetworkDeviceSchema, NetworkDeviceInSchema, ConnectionSchema,
    TopologyGraphOutSchema, NOCSummaryOutSchema, ProbeResultOutSchema,
    QuarantineDeviceInSchema, AutoTicketInSchema, TopologyNodeSchema, TopologyLinkSchema
)

router = Router()

# ─── Payload Schemas ─────────────────────────────────────────────────────────

class ScanTriggerPayload(Schema):
    subnet: Optional[str] = "192.168.1.0/24"
    scanType: Optional[str] = "PING_ARP"
    devices: Optional[List[dict]] = None

class PromoteDevicePayload(Schema):
    asset_category: Optional[str] = "Network Switch"
    location_id: Optional[int] = None
    department_id: Optional[int] = None
    asset_name: Optional[str] = None
    asset_tag: Optional[str] = None

# ─── Subnet Discovery & NOC Topology (Static routes before parameterized) ──

@router.get("/devices/topology", response=TopologyGraphOutSchema)
def get_topology_graph(request):
    """Generate dynamic campus topology graph combining explicit connections and subnet hierarchy."""
    devices = list(NetworkDevice.objects.filter(is_staged=False).select_related('mapped_asset').all())
    
    nodes: List[dict] = []
    gateway_id = None
    core_switches: List[int] = []

    for d in devices:
        cluster = "ENDPOINT"
        dtype = (d.device_type or "").upper()
        if dtype == "ROUTER" or d.ip_address.endswith(".1"):
            cluster = "GATEWAY"
            if gateway_id is None:
                gateway_id = d.id
        elif dtype == "SWITCH":
            cluster = "CORE_SWITCH"
            core_switches.append(d.id)
        elif dtype == "ACCESS_POINT":
            cluster = "ACCESS_POINT"
        elif dtype == "SERVER":
            cluster = "SERVER"
        elif dtype == "CAMERA":
            cluster = "CAMERA"
        elif dtype == "PRINTER":
            cluster = "PRINTER"
        else:
            cluster = "ENDPOINT"

        label = d.hostname or (d.mapped_asset.name if d.mapped_asset else d.ip_address)
        nodes.append({
            "id": d.id,
            "label": label,
            "ip_address": d.ip_address,
            "mac_address": d.mac_address,
            "device_type": d.device_type or "GENERIC",
            "status": d.status or "ONLINE",
            "latency_ms": d.latency_ms or 0.0,
            "vlan_id": getattr(d, 'vlan_id', 1) or 1,
            "is_rogue": getattr(d, 'is_rogue', False),
            "quarantined": getattr(d, 'quarantined', False),
            "open_ports": d.open_ports or [],
            "vendor": d.vendor or "Generic",
            "cluster": cluster,
            "asset_tag": d.mapped_asset.asset_tag if d.mapped_asset else None,
        })

    if gateway_id is None and devices:
        gateway_id = devices[0].id

    links: List[dict] = []
    seen_links = set()

    # 1. Add explicit database connections
    explicit_conns = Connection.objects.select_related('source_device', 'target_device').all()
    for c in explicit_conns:
        if c.source_device and c.target_device:
            link_key = tuple(sorted([c.source_device.id, c.target_device.id]))
            if link_key not in seen_links:
                seen_links.add(link_key)
                links.append({
                    "id": f"link-{c.id}",
                    "source": c.source_device.id,
                    "target": c.target_device.id,
                    "link_type": "FIBER" if "fiber" in (c.speed or "").lower() else "ETHERNET",
                    "speed_mbps": 10000 if "10" in (c.speed or "") else 1000,
                    "status": "ACTIVE",
                    "traffic_load_pct": 45,
                    "port_source_label": c.port or "P01",
                    "port_target_label": "Uplink",
                })

    # 2. Inferred Hierarchy: Connect Core Switches to Gateway, and Endpoints to Core Switches
    if gateway_id:
        for sw_id in core_switches:
            if sw_id != gateway_id:
                link_key = tuple(sorted([gateway_id, sw_id]))
                if link_key not in seen_links:
                    seen_links.add(link_key)
                    links.append({
                        "id": f"tree-gw-{sw_id}",
                        "source": gateway_id,
                        "target": sw_id,
                        "link_type": "FIBER",
                        "speed_mbps": 10000,
                        "status": "ACTIVE",
                        "traffic_load_pct": 65,
                        "port_source_label": "Trunk-01",
                        "port_target_label": "Uplink",
                    })

        target_hub_id = core_switches[0] if core_switches else gateway_id
        for d in devices:
            if d.id != gateway_id and d.id not in core_switches:
                link_key = tuple(sorted([target_hub_id, d.id]))
                if link_key not in seen_links:
                    seen_links.add(link_key)
                    is_wireless = d.device_type == "ACCESS_POINT" or "wifi" in (d.hostname or "").lower()
                    links.append({
                        "id": f"tree-sw-{d.id}",
                        "source": target_hub_id,
                        "target": d.id,
                        "link_type": "WIRELESS" if is_wireless else "ETHERNET",
                        "speed_mbps": 1000,
                        "status": "ACTIVE" if d.status == "ONLINE" else "DEGRADED",
                        "traffic_load_pct": 25,
                        "port_source_label": f"P{d.id % 24 + 1:02d}",
                        "port_target_label": "Eth0",
                    })

    return {
        "nodes": nodes,
        "links": links,
        "total_nodes": len(nodes),
        "total_links": len(links),
        "gateway_node_id": gateway_id,
    }

@router.get("/devices/noc/summary", response=NOCSummaryOutSchema)
def get_noc_summary(request):
    """Returns aggregate Network Operations Center (NOC) metrics and health summary."""
    devices = list(NetworkDevice.objects.filter(is_staged=False).all())
    total_managed = len(devices)
    online_count = sum(1 for d in devices if d.status == "ONLINE")
    degraded_count = sum(1 for d in devices if d.status == "DEGRADED")
    offline_count = sum(1 for d in devices if d.status in ["OFFLINE", "DOWN"])
    rogue_count = NetworkDevice.objects.filter(is_rogue=True).count()
    quarantined_count = NetworkDevice.objects.filter(quarantined=True).count()
    
    online_latencies = [d.latency_ms for d in devices if d.status == "ONLINE" and d.latency_ms and d.latency_ms > 0]
    avg_latency = round(sum(online_latencies) / len(online_latencies), 2) if online_latencies else 2.4

    gateway_dev = next((d for d in devices if (d.device_type or "").upper() == "ROUTER" or d.ip_address.endswith(".1")), None)
    gateway_status = gateway_dev.status if gateway_dev else ("ONLINE" if online_count > 0 else "OFFLINE")

    latest_probed = NetworkDevice.objects.filter(last_ping_at__isnull=False).order_by('-last_ping_at').first()
    last_sweep = latest_probed.last_ping_at.isoformat() if latest_probed and latest_probed.last_ping_at else timezone.now().isoformat()

    return {
        "total_managed": total_managed,
        "online_count": online_count,
        "degraded_count": degraded_count,
        "offline_count": offline_count,
        "rogue_count": rogue_count,
        "quarantined_count": quarantined_count,
        "average_latency_ms": avg_latency,
        "gateway_status": gateway_status,
        "last_sweep_at": last_sweep,
    }

@router.get("/devices/discovery/staged", response=List[NetworkDeviceSchema])
def get_staged_devices(request):
    """Return devices discovered during a scan but not yet promoted to managed."""
    return list(NetworkDevice.objects.filter(is_staged=True).select_related('mapped_asset').all())

@router.post("/devices/discovery/scan")
def trigger_scan(request, payload: ScanTriggerPayload):
    """Trigger an asynchronous multi-threaded CIDR subnet scan or ingest discovered batch."""
    from core.network_scanner import start_subnet_scan
    
    if payload.devices and len(payload.devices) > 0:
        created = 0
        for d in payload.devices:
            mac = d.get("mac_address")
            ip = d.get("ip_address", "127.0.0.1")
            hostname = d.get("hostname", f"host-{ip.replace('.', '-')}")
            vendor = d.get("vendor", "Generic")
            if mac:
                obj, is_new = NetworkDevice.objects.get_or_create(
                    mac_address=mac,
                    defaults={
                        "ip_address": ip,
                        "hostname": hostname,
                        "vendor": vendor,
                        "is_staged": True,
                        "status": "ONLINE",
                    }
                )
                if is_new:
                    created += 1
        return {"message": f"Scan complete. {created} device(s) staged.", "job_id": "batch_direct"}

    subnet = payload.subnet or "192.168.1.0/24"
    job = start_subnet_scan(subnet)
    return {
        "message": f"Subnet scan initiated on {subnet}",
        "job_id": job.job_id,
        "subnet": subnet,
        "status": "RUNNING",
    }

@router.get("/devices/discovery/status")
def get_discovery_status(request, job_id: Optional[str] = None):
    """Stream or query scan job progress and discovered host count."""
    from core.network_scanner import get_scan_status, SCAN_JOBS, SCAN_LOCK
    
    if not job_id:
        with SCAN_LOCK:
            if SCAN_JOBS:
                latest_job = list(SCAN_JOBS.values())[-1]
                return latest_job.to_dict()
        return {"is_complete": True, "progress_percent": 100, "scanned_count": 0, "discovered_count": 0}

    status = get_scan_status(job_id)
    if not status:
        return {"is_complete": True, "progress_percent": 100, "scanned_count": 0, "discovered_count": 0, "error": "Job not found"}
    return status

@router.post("/devices/discovery/promote/{device_id}", response=NetworkDeviceSchema)
def promote_device(request, device_id: int, payload: Optional[PromoteDevicePayload] = None):
    """Promote a staged network device and auto-instantiate linked models.Asset."""
    device = get_object_or_404(NetworkDevice, id=device_id)
    device.is_staged = False

    # Auto-create or link Asset if not present
    if not device.mapped_asset:
        category = payload.asset_category if payload and payload.asset_category else (
            "Network Switch" if device.device_type == "SWITCH" else
            "Router" if device.device_type == "ROUTER" else
            "Server" if device.device_type == "SERVER" else
            "Printer" if device.device_type == "PRINTER" else
            "Hardware Asset"
        )
        tag = payload.asset_tag if payload and payload.asset_tag else f"AST-NET-{device.id:04d}"
        name = payload.asset_name if payload and payload.asset_name else (device.hostname or f"{device.vendor or 'Network'} {category}")
        
        location_obj = None
        if payload and payload.location_id:
            location_obj = Location.objects.filter(id=payload.location_id).first()

        asset = Asset.objects.create(
            asset_tag=tag,
            name=name,
            category=category,
            make=device.vendor or "Generic Vendor",
            ip_address=device.ip_address,
            mac_address=device.mac_address,
            status="ACTIVE",
            location=location_obj,
        )
        device.mapped_asset = asset

    device.save()

    OperationLog.objects.create(
        action="PROMOTE",
        resource_type="NetworkDevice",
        resource_id=str(device.id),
        details={"ip": device.ip_address, "mac": device.mac_address, "asset_id": device.mapped_asset_id},
    )
    return device

@router.post("/devices/poll-now")
@router.post("/network/poll-now")
def poll_network_health(request):
    """Executes on-demand health polling and latency checks across all managed network devices."""
    from core.network_scanner import poll_all_managed_devices
    results = poll_all_managed_devices()
    return {
        "success": True,
        "message": f"Polled {results['polled_count']} device(s). {results['online_count']} online, {results['degraded_count']} degraded, {results['offline_count']} offline.",
        "details": results,
    }

@router.post("/devices/{device_id}/probe", response=ProbeResultOutSchema)
def probe_device_now(request, device_id: int):
    """Executes an instant on-demand socket probe on a specific network device."""
    from core.network_scanner import probe_single_device
    device = get_object_or_404(NetworkDevice, id=device_id)
    return probe_single_device(device)

@router.post("/devices/{device_id}/quarantine")
def toggle_quarantine_device(request, device_id: int, payload: Optional[QuarantineDeviceInSchema] = None):
    """Toggle network quarantine isolation status for a network device."""
    device = get_object_or_404(NetworkDevice, id=device_id)
    device.quarantined = not device.quarantined
    device.save()
    
    action = "QUARANTINE" if device.quarantined else "UNQUARANTINE"
    OperationLog.objects.create(
        action=action,
        resource_type="NetworkDevice",
        resource_id=str(device.id),
        details={"ip": device.ip_address, "mac": device.mac_address, "reason": payload.reason if payload else "NOC manual action"},
    )
    return {
        "success": True,
        "quarantined": device.quarantined,
        "message": f"Device {device.ip_address} has been {'quarantined' if device.quarantined else 'released from quarantine'}.",
    }

@router.post("/devices/{device_id}/auto-ticket")
def auto_create_rogue_ticket(request, device_id: int, payload: Optional[AutoTicketInSchema] = None):
    """Automatically files a high-priority IT Security incident ticket for a rogue device."""
    device = get_object_or_404(NetworkDevice, id=device_id)
    priority = payload.priority if payload and payload.priority else "HIGH"
    
    ticket = Ticket.objects.create(
        title=f"[SECURITY ALERT] Rogue Device Detected on Subnet: {device.ip_address}",
        description=(
            f"Automated Intrusion & Rogue Device Alert from Network Operations Center (NOC):\n\n"
            f"• IP Address: {device.ip_address}\n"
            f"• MAC Address: {device.mac_address}\n"
            f"• Vendor: {device.vendor or 'Unknown'}\n"
            f"• Detected Open Ports: {device.open_ports}\n"
            f"• Quarantine Status: {'Quarantined' if device.quarantined else 'Active / Exposed'}\n\n"
            f"Technician Notes: {payload.notes if payload and payload.notes else 'Unrecognized MAC signature. Investigate physical switch port or authorize asset.'}"
        ),
        category="NETWORK",
        priority=priority,
        status="NEW",
        asset_id=str(device.mapped_asset.id) if device.mapped_asset else None,
    )
    
    OperationLog.objects.create(
        action="CREATE_SECURITY_TICKET",
        resource_type="Ticket",
        resource_id=str(ticket.id),
        details={"ticket_id": ticket.id, "device_id": device.id, "ip": device.ip_address},
    )
    
    return {
        "success": True,
        "ticket_id": ticket.id,
        "tracking_code": ticket.tracking_code,
        "message": f"Security Incident Ticket #{ticket.id} created successfully.",
    }

# ─── /network & /devices CRUD ───────────────────────────────────────────────

from .utils import safe_fk_id, log_operation

def normalize_network_device_payload(payload_dict: dict) -> dict:
    data = {}
    for key, camel in [
        ("ip_address", "ipAddress"),
        ("mac_address", "macAddress"),
        ("hostname", "hostname"),
        ("vendor", "vendor"),
        ("device_type", "deviceType"),
        ("status", "status"),
        ("is_staged", "isStaged"),
        ("snmp_sys_descr", "snmpSysDescr"),
        ("os_fingerprint", "osFingerprint"),
        ("monitoring_enabled", "monitoringEnabled"),
    ]:
        val = payload_dict.get(key) if payload_dict.get(key) is not None else payload_dict.get(camel)
        if val is not None:
            data[key] = val
            
    mapped_val = payload_dict.get("mapped_asset_id") if payload_dict.get("mapped_asset_id") is not None else payload_dict.get("mappedAssetId")
    if mapped_val is not None:
        data["mapped_asset_id"] = safe_fk_id(mapped_val)
        
    ports_val = payload_dict.get("open_ports") if payload_dict.get("open_ports") is not None else payload_dict.get("openPorts")
    if ports_val is not None:
        data["open_ports"] = ports_val
        
    return data

@router.get("/network", response=List[NetworkDeviceSchema])
def get_network_devices(request):
    return list(NetworkDevice.objects.select_related('mapped_asset').all())

@router.get("/devices", response=List[NetworkDeviceSchema])
def get_devices(request):
    return list(NetworkDevice.objects.filter(is_staged=False).select_related('mapped_asset').all())

@router.post("/network", response=NetworkDeviceSchema)
@router.post("/devices", response=NetworkDeviceSchema)
def create_network_device(request, payload: NetworkDeviceInSchema):
    raw_data = payload.dict(exclude_unset=True)
    data = normalize_network_device_payload(raw_data)
    device = NetworkDevice.objects.create(**data)
    log_operation(
        action="CREATE",
        resource_type="NetworkDevice",
        resource_id=str(device.id),
        details={"ip": device.ip_address, "mac": device.mac_address, "hostname": device.hostname},
    )
    return device

@router.get("/network/{device_id}", response=NetworkDeviceSchema)
@router.get("/devices/{device_id}", response=NetworkDeviceSchema)
def get_network_device(request, device_id: int):
    return get_object_or_404(NetworkDevice.objects.select_related('mapped_asset'), id=device_id)

@router.patch("/network/{device_id}", response=NetworkDeviceSchema)
@router.patch("/devices/{device_id}", response=NetworkDeviceSchema)
def update_network_device(request, device_id: int, payload: NetworkDeviceInSchema):
    device = get_object_or_404(NetworkDevice, id=device_id)
    raw_data = payload.dict(exclude_unset=True)
    data = normalize_network_device_payload(raw_data)
    for attr, value in data.items():
        setattr(device, attr, value)
    device.save()
    log_operation(
        action="UPDATE",
        resource_type="NetworkDevice",
        resource_id=str(device.id),
        details={"updated_fields": list(data.keys()), "status": device.status},
    )
    return device

@router.delete("/network/{device_id}")
@router.delete("/devices/{device_id}")
@require_admin
def delete_network_device(request, device_id: int):
    device = get_object_or_404(NetworkDevice, id=device_id)
    log_operation(
        action="DELETE",
        resource_type="NetworkDevice",
        resource_id=str(device.id),
        details={"ip": device.ip_address, "mac": device.mac_address},
    )
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
