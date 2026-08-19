import ipaddress
import platform
import re
import socket
import subprocess
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Optional, Any
from django.utils import timezone
from core.models import NetworkDevice, Ticket, Asset, OperationLog

# Known MAC OUI vendor prefix database for fast institutional identification
OUI_VENDOR_MAP = {
    "00:00:0C": "Cisco Systems",
    "00:01:42": "Cisco Systems",
    "00:1A:A0": "Dell Inc.",
    "00:14:22": "Dell Inc.",
    "B8:27:EB": "Raspberry Pi Foundation",
    "DC:A6:32": "Raspberry Pi Foundation",
    "E4:5F:01": "Raspberry Pi Foundation",
    "00:0C:29": "VMware, Inc.",
    "00:50:56": "VMware, Inc.",
    "3C:D9:2B": "Hewlett Packard",
    "70:5A:0F": "HP Inc.",
    "00:11:32": "Synology Inc.",
    "00:1B:67": "Cisco-Linksys",
    "24:A4:3C": "Ubiquiti Inc.",
    "B4:FB:E4": "Ubiquiti Inc.",
    "F0:9F:C2": "Ubiquiti Inc.",
    "00:15:5D": "Microsoft Corporation",
    "00:1C:42": "Parallels, Inc.",
    "00:25:90": "Super Micro Computer",
    "AC:DE:48": "Apple, Inc.",
    "F0:18:98": "Apple, Inc.",
    "00:26:B9": "Dell Inc.",
    "48:2C:67": "TP-Link Corporation",
    "50:C7:BF": "TP-Link Corporation",
    "00:18:FE": "Hewlett Packard Enterprise",
    "00:21:B7": "Lexmark International",
    "00:00:48": "Epson Corporation",
}

SIGNATURE_PORTS = [22, 80, 443, 161, 445, 9100, 8080]

def resolve_vendor_by_mac(mac_address: Optional[str]) -> str:
    if not mac_address:
        return "Generic Vendor"
    clean_mac = mac_address.replace("-", ":").upper()
    prefix = clean_mac[:8]
    return OUI_VENDOR_MAP.get(prefix, "Generic Vendor")

def get_mac_from_arp(ip_str: str) -> Optional[str]:
    """Extract MAC address for IP from local OS ARP table."""
    try:
        is_windows = platform.system().lower() == "windows"
        cmd = ["arp", "-a", ip_str] if is_windows else ["arp", "-n", ip_str]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=1.5)
        out = res.stdout
        
        # Look for standard MAC pattern XX-XX-XX-XX-XX-XX or XX:XX:XX:XX:XX:XX
        mac_match = re.search(r"([0-9a-fA-F]{2}[:-]){5}([0-9a-fA-F]{2})", out)
        if mac_match:
            return mac_match.group(0).replace("-", ":").upper()
    except Exception:
        pass
    return None

def probe_port(ip_str: str, port: int, timeout: float = 0.08) -> Optional[tuple]:
    t_start = time.perf_counter()
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(timeout)
    try:
        res = s.connect_ex((ip_str, port))
        if res == 0:
            latency = (time.perf_counter() - t_start) * 1000.0
            return (port, latency)
    except Exception:
        pass
    finally:
        s.close()
    return None

def probe_host(ip_str: str, timeout: float = 0.08) -> Optional[Dict[str, Any]]:
    """Probes an IP for availability, latency, open signature ports, and hostname."""
    open_ports = []
    min_latency = None
    is_alive = False

    # 1. Parallel TCP SYN probe across signature ports
    with ThreadPoolExecutor(max_workers=len(SIGNATURE_PORTS)) as executor:
        futures = [executor.submit(probe_port, ip_str, p, timeout) for p in SIGNATURE_PORTS]
        for f in as_completed(futures):
            res = f.result()
            if res:
                port, latency = res
                open_ports.append(port)
                is_alive = True
                if min_latency is None or latency < min_latency:
                    min_latency = latency

    # 2. If no ports responded, try fast ping fallback
    if not is_alive:
        is_windows = platform.system().lower() == "windows"
        ping_cmd = ["ping", "-n", "1", "-w", "100", ip_str] if is_windows else ["ping", "-c", "1", "-W", "1", ip_str]
        try:
            t_start = time.perf_counter()
            p = subprocess.run(ping_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=0.15)
            if p.returncode == 0:
                is_alive = True
                min_latency = (time.perf_counter() - t_start) * 1000.0
        except Exception:
            pass

    if not is_alive:
        return None

    # 3. Resolve reverse DNS Hostname
    hostname = None
    try:
        host_info = socket.gethostbyaddr(ip_str)
        if host_info and host_info[0]:
            hostname = host_info[0]
    except Exception:
        hostname = None

    # 4. Resolve MAC & Vendor
    mac = get_mac_from_arp(ip_str)
    if not mac:
        # Construct deterministic MAC for virtual/loopback test environments
        last_octet = ip_str.split(".")[-1] if "." in ip_str else "1"
        mac = f"02:00:00:00:00:{int(last_octet) % 256:02X}"
    
    vendor = resolve_vendor_by_mac(mac)

    # 5. Classify Device Type
    device_type = "WORKSTATION"
    if 9100 in open_ports:
        device_type = "PRINTER"
    elif 161 in open_ports or (22 in open_ports and ("Cisco" in vendor or "Ubiquiti" in vendor or "TP-Link" in vendor)):
        device_type = "SWITCH"
    elif "Ubiquiti" in vendor and (80 in open_ports or 443 in open_ports):
        device_type = "ACCESS_POINT"
    elif 445 in open_ports or (22 in open_ports and 80 in open_ports):
        device_type = "SERVER"
    elif 80 in open_ports or 443 in open_ports:
        device_type = "ROUTER"

    return {
        "ip_address": ip_str,
        "mac_address": mac,
        "hostname": hostname or f"host-{ip_str.replace('.', '-')}",
        "vendor": vendor,
        "device_type": device_type,
        "latency_ms": round(min_latency or 1.0, 2),
        "open_ports": open_ports,
        "status": "ONLINE",
    }


class ActiveScanJob:
    def __init__(self, job_id: str, subnet_cidr: str):
        self.job_id = job_id
        self.subnet_cidr = subnet_cidr
        self.total_ips = 0
        self.scanned_count = 0
        self.discovered_count = 0
        self.discovered_devices: List[Dict[str, Any]] = []
        self.is_complete = False
        self.error: Optional[str] = None
        self.started_at = timezone.now()
        self.completed_at: Optional[Any] = None

    @property
    def progress_percent(self) -> int:
        if self.total_ips == 0:
            return 0
        return int((self.scanned_count / self.total_ips) * 100)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "job_id": self.job_id,
            "subnet": self.subnet_cidr,
            "progress_percent": self.progress_percent,
            "total_ips": self.total_ips,
            "scanned_count": self.scanned_count,
            "discovered_count": self.discovered_count,
            "discovered_devices": self.discovered_devices,
            "is_complete": self.is_complete,
            "error": self.error,
        }


SCAN_JOBS: Dict[str, ActiveScanJob] = {}
SCAN_LOCK = threading.Lock()


def run_subnet_sweep(job_id: str, subnet_cidr: str):
    """Executes the asynchronous subnet sweep in a background worker thread."""
    with SCAN_LOCK:
        job = SCAN_JOBS.get(job_id)
    if not job:
        return

    try:
        # Parse CIDR or single IP
        if "/" not in subnet_cidr:
            subnet_cidr = f"{subnet_cidr}/32"
        net = ipaddress.ip_network(subnet_cidr, strict=False)
        ip_list = [str(ip) for ip in net.hosts()]
        if not ip_list:
            ip_list = [str(net.network_address)]
        
        job.total_ips = len(ip_list)

        # Multi-threaded sweep
        with ThreadPoolExecutor(max_workers=min(50, max(4, len(ip_list)))) as executor:
            future_to_ip = {executor.submit(probe_host, ip): ip for ip in ip_list}
            for future in as_completed(future_to_ip):
                job.scanned_count += 1
                try:
                    result = future.result()
                    if result:
                        job.discovered_count += 1
                        job.discovered_devices.append(result)
                        
                        # Upsert staged device into database
                        NetworkDevice.objects.update_or_create(
                            mac_address=result["mac_address"],
                            defaults={
                                "ip_address": result["ip_address"],
                                "hostname": result["hostname"],
                                "vendor": result["vendor"],
                                "device_type": result["device_type"],
                                "latency_ms": result["latency_ms"],
                                "open_ports": result["open_ports"],
                                "is_staged": True,
                                "status": "ONLINE",
                                "last_ping_at": timezone.now(),
                            }
                        )
                except Exception as e:
                    pass

        job.is_complete = True
        job.completed_at = timezone.now()
    except Exception as exc:
        job.error = str(exc)
        job.is_complete = True


def start_subnet_scan(subnet_cidr: str) -> ActiveScanJob:
    """Spawns an asynchronous subnet scan worker and returns the job tracker."""
    job_id = f"scan_{uuid.uuid4().hex[:10]}"
    job = ActiveScanJob(job_id, subnet_cidr)
    with SCAN_LOCK:
        SCAN_JOBS[job_id] = job

    worker = threading.Thread(target=run_subnet_sweep, args=(job_id, subnet_cidr), daemon=True)
    worker.start()
    return job


def get_scan_status(job_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve the real-time progress of a scan job."""
    with SCAN_LOCK:
        job = SCAN_JOBS.get(job_id)
        return job.to_dict() if job else None


def poll_all_managed_devices() -> Dict[str, Any]:
    """
    Background health poller: probes all non-staged managed devices,
    updates latency and status (ONLINE -> DEGRADED -> OFFLINE),
    and automatically creates critical Helpdesk Incident Tickets if needed.
    """
    devices = list(NetworkDevice.objects.filter(is_staged=False, monitoring_enabled=True))
    polled_count = len(devices)
    online_count = 0
    degraded_count = 0
    offline_count = 0
    tickets_created = 0

    for dev in devices:
        res = probe_host(dev.ip_address, timeout=0.8)
        now = timezone.now()
        dev.last_ping_at = now

        if res:
            dev.latency_ms = res["latency_ms"]
            dev.consecutive_failures = 0
            dev.status = "ONLINE"
            if res.get("open_ports"):
                dev.open_ports = res["open_ports"]
            online_count += 1
        else:
            dev.consecutive_failures += 1
            if dev.consecutive_failures == 1:
                dev.status = "DEGRADED"
                degraded_count += 1
            else:
                dev.status = "OFFLINE"
                offline_count += 1

            # If 3 consecutive failures on critical device, generate outage ticket
            if dev.consecutive_failures == 3 and dev.device_type in ["SWITCH", "ROUTER", "SERVER", "GENERIC"]:
                ticket_title = f"[OUTAGE] Critical Device {dev.hostname or dev.ip_address} is Unreachable"
                
                # Prevent duplicate unresolved outage ticket
                existing = Ticket.objects.filter(title=ticket_title, status__in=["NEW", "OPEN", "IN_PROGRESS"]).first()
                if not existing:
                    Ticket.objects.create(
                        title=ticket_title,
                        description=(
                            f"Automated Network Health Alert:\n"
                            f"Device: {dev.hostname or 'Unnamed'}\n"
                            f"IP Address: {dev.ip_address}\n"
                            f"MAC Address: {dev.mac_address}\n"
                            f"Device Type: {dev.device_type}\n"
                            f"Consecutive Failed Polls: 3\n"
                            f"Detected at: {now.isoformat()}"
                        ),
                        category="NETWORK",
                        priority="CRITICAL",
                        status="NEW",
                        asset_id=str(dev.mapped_asset.id) if dev.mapped_asset else None,
                    )
                    tickets_created += 1

        dev.save()

    return {
        "polled_count": polled_count,
        "online_count": online_count,
        "degraded_count": degraded_count,
        "offline_count": offline_count,
        "tickets_created": tickets_created,
    }
