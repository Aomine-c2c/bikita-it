# Network Scanner & Subnet Discovery Design Specification

**Date:** 2026-08-14  
**Feature Area:** Network Scanner & Device Discovery  
**Target Components:**
- Frontend: [`NetworkScannerModal.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/components/network/NetworkScannerModal.tsx), [`DiscoveryStagingTable.tsx`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/components/network/DiscoveryStagingTable.tsx), [`api.ts`](file:///c:/Users/armut/404/BikitaIT/apps/web/src/lib/api.ts)
- Backend: [`network.py`](file:///c:/Users/armut/404/BikitaIT/apps/api/core/routers/network.py), Network Scanner Engine Service

---

## 1. Overview & Objectives
Transform the Network Scanner Modal into a production-ready CIDR subnet discovery engine. The scanner will perform actual network host discovery using system `nmap` (if available) with a fallback to Python concurrent socket probes, reporting live progress via background job polling to the React frontend.

---

## 2. Architecture & Components

```
┌────────────────────────────────┐         ┌───────────────────────────────────────┐
│ NetworkScannerModal (React)    │         │ FastAPI Backend (network.py)          │
│                                │         │                                       │
│  - CIDR Subnet Input           │         │  - Background Scan Task Manager       │
│  - Scan Protocol Selector      │ ──────> │  - POST /devices/discovery/scan/start │
│  - Live Polling Progress (0-100%)│ <====== │  - GET  /devices/discovery/scan/status│
└────────────────────────────────┘  poll   └───────────────────────────────────────┘
                                                       │
                                                       ▼
                                           ┌───────────────────────────────────────┐
                                           │ Discovery Engine                      │
                                           │                                       │
                                           │  - nmap CLI subprocess (if available) │
                                           │  - Python ThreadPool socket fallback  │
                                           └───────────────────────────────────────┘
                                                       │
                                                       ▼
                                           ┌───────────────────────────────────────┐
                                           │ Django DB (NetworkDevice)             │
                                           │                                       │
                                           │  - Save as `is_staged=True`           │
                                           │  - Auto-link with existing Assets     │
                                           └───────────────────────────────────────┘
```

### Backend (`apps/api/core/routers/network.py`)
1. **Background Job Manager (`ScanJobManager`)**:
   - In-memory dictionary tracking active and completed scan tasks: `{ job_id: { status, progress, total_scanned, discovered, error, devices } }`.
   - Thread safety using Python `threading.Lock`.

2. **Scanner Engine**:
   - **`nmap` Path Check**: `shutil.which("nmap")`.
   - **Nmap Mode**: Runs `nmap -sn <CIDR>` (PING_ARP) or `nmap -sU -p 161 <CIDR>` (SNMP) or `nmap -F <CIDR>` (FULL_SCAN) with `-oX -` output for XML parsing.
   - **Python Socket Sweep Fallback**: Parses CIDR using `ipaddress.ip_network(subnet, strict=False)`. Uses `concurrent.futures.ThreadPoolExecutor(max_workers=50)` to probe port 80/443/22/135/445 and ping.
   - Updates `progress` in job status as IPs are processed.

3. **Endpoints**:
   - `POST /devices/discovery/scan/start`: Accepts `{ subnet: str, scan_type: str }`. Validates CIDR notation, starts thread/background execution, returns `{ job_id: str }`.
   - `GET /devices/discovery/scan/status/{job_id}`: Returns current scan status (`RUNNING`, `COMPLETED`, `FAILED`), `progress` (0-100), `discovered_count`, and staged `devices`.

4. **Staging & Auto-Link Logic**:
   - On scan completion, iterates over discovered live hosts.
   - Creates or updates `NetworkDevice` entries with `is_staged=True`, `status="ONLINE"`.
   - Attempts auto-link against existing hardware `Asset` records by matching IP or MAC address.

### Frontend (`apps/web/src/components/network/NetworkScannerModal.tsx`)
1. Update form submission to call `networkApi.startScan({ subnet, scanType })`.
2. Start interval polling `networkApi.getScanStatus(jobId)` every 500ms.
3. Dynamically reflect actual percentage progress, current target CIDR, and live host count.
4. On `COMPLETED`, trigger `onSuccess()` to refresh `DiscoveryStagingTable` and `NetworkTopology`, then close modal.

---

## 3. Data Schema & Contracts

### Request Body (`POST /devices/discovery/scan/start`)
```json
{
  "subnet": "192.168.1.0/24",
  "scan_type": "PING_ARP"
}
```

### Response Body (`GET /devices/discovery/scan/status/{job_id}`)
```json
{
  "job_id": "scan_1723632000_a1b2",
  "status": "RUNNING",
  "progress": 45,
  "subnet": "192.168.1.0/24",
  "total_scanned": 115,
  "total_hosts": 254,
  "discovered_count": 8,
  "devices": [
    {
      "ip_address": "192.168.1.1",
      "mac_address": "00:11:22:33:44:55",
      "hostname": "gateway.local",
      "vendor": "Cisco Systems"
    }
  ]
}
```

---

## 4. Verification & Testing Strategy
1. **Unit Tests**:
   - Validate CIDR parsing (e.g. `192.168.1.0/24`, `10.0.0.0/28`).
   - Mock `nmap` XML output parsing and socket fallback logic.
2. **Integration Verification**:
   - Call `POST /devices/discovery/scan/start` with loopback subnet (`127.0.0.1/32` or local IP range).
   - Poll `GET /devices/discovery/scan/status/{job_id}` until `COMPLETED`.
   - Verify `NetworkDevice` records in database are populated with `is_staged=True`.
3. **UI Verification**:
   - Open Network Scanner modal in web UI.
   - Execute a scan, verify progress bar updates smoothly, and check that staged devices reload in `DiscoveryStagingTable`.
