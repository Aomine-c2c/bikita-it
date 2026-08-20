/* eslint-disable @typescript-eslint/no-explicit-any */
 

/**
 * Pulse API Client
 * Centralised fetch wrapper for all backend API calls.
 * In Tauri mode the sidecar picks a random port at startup — we resolve it
 * once via the `get_api_port` Tauri command and cache it for the session.
 */



export function getSavedApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('pulse_api_base_url');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api';
}

export function saveApiBaseUrl(url: string) {
  if (typeof window !== 'undefined') {
    let cleanUrl = url.trim().replace(/\/+$/, '');
    if (!cleanUrl.endsWith('/api')) {
      cleanUrl = `${cleanUrl}/api`;
    }
    localStorage.setItem('pulse_api_base_url', cleanUrl);
  }
}

async function getApiBase(): Promise<string> {
  return getSavedApiBaseUrl();
}

function getAuthToken() {
  if (typeof window === 'undefined') return null;
  // Temporary fallback until HttpOnly cookies are fully implemented on backend
  return localStorage.getItem('token');
}

import { registry } from '@/lib/core';

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

/**
 * Determines whether an error is a network-level failure (connection refused,
 * backend not yet started) as opposed to an HTTP error (4xx/5xx).
 * Only network failures should be retried.
 */
function isNetworkError(err: any): boolean {
  return err instanceof TypeError && err.message === 'Failed to fetch';
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retries = 5,
): Promise<T> {
  const extensions = registry.getApiExtensions();
  for (const ext of extensions) {
    if (path.startsWith(ext.matchPrefix)) {
      return await ext.handler(path, options) as T;
    }
  }

  // Unified HTTP fetching (removes Tauri IPC multiplexing)

  const base = await getApiBase();
  const url = `${base}${path}`;
  const token = getAuthToken();

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let attempt = 0;
  while (true) {
    try {
      const res = await fetch(url, {
        ...options,
        headers,
        credentials: 'omit', // Switch to 'include' when migrating to HttpOnly cookies
      });

      if (!res.ok) {
        const isPublicRoute =
          typeof window !== 'undefined' &&
          (window.location.pathname.startsWith('/login') ||
            window.location.pathname.startsWith('/portal') ||
            window.location.pathname.startsWith('/welcome') ||
            window.location.pathname.startsWith('/setup'));

        if (res.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('refresh_token');
          if (!isPublicRoute) {
            window.location.replace('/login');
          }
        }
        const error = await res.text();
        throw new Error(`API Error ${res.status}: ${error}`);
      }

      const data = await res.json();
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid API response format');
      }
      return data as T;
    } catch (err) {
      // Only retry on network-level failures (backend not yet up).
      // HTTP errors (4xx/5xx) are surfaced immediately.
      if (isNetworkError(err) && attempt < retries) {
        const delay = Math.min(500 * Math.pow(2, attempt), 8000);
        console.warn(`[apiFetch] Backend not reachable, retrying in ${delay}ms... (attempt ${attempt + 1}/${retries})`);
        await sleep(delay);
        attempt++;
        continue;
      }
      throw err;
    }
  }
}

/**
 * Waits until the backend API server is reachable.
 * Useful for showing a "starting up" state in the UI before the first fetch.
 */
export async function waitForBackend(timeoutMs = 30_000): Promise<void> {
  const base = await getApiBase();
  const deadline = Date.now() + timeoutMs;
  let delay = 500;
  while (Date.now() < deadline) {
    try {
      await fetch(`${base}/settings`, { signal: AbortSignal.timeout(2000) });
      return; // backend is up
    } catch {
      await sleep(delay);
      delay = Math.min(delay * 2, 4000);
    }
  }
  throw new Error('Backend did not start within the timeout period.');
}

// Export the helper so login page can use it without duplicating the logic
export { getApiBase };


// ---------- Asset API ----------
export interface Paginated<T> {
  [key: string]: any; data: T[]; pagination: { total: number; page: number; limit: number; pages: number } }

export interface Asset {
   

  [key: string]: any;
  id: string;
  name: string;
  category: string;
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  assetTag?: string | null;
  status: string;
  condition?: string | null;
  purchaseDate?: string | null;
  warrantyExpiry?: string | null;
  ipAddress?: string | null;
  macAddress?: string | null;
  specs?: Record<string, string> | null;
  assigneeId?: string | null;
  assignedUser?: { id: string; name: string; email: string } | null;
  repairs?: Array<{ id: string; description: string; status: string; createdAt: string }>;
  location?: { id: string; name: string; type: string } | null;
  createdAt: string;
}

function normalizeAsset(raw: any): Asset {
  const assignee = raw.assigned_to ?? raw.assignedUser ?? raw.assignee ?? null;
  const loc = raw.location ?? null;
  return {
    ...raw,
    manufacturer: raw.manufacturer ?? raw.make ?? null,
    assetTag: raw.assetTag ?? raw.asset_tag ?? raw.tag ?? null,
    serialNumber: raw.serialNumber ?? raw.serial_number ?? null,
    ipAddress: raw.ipAddress ?? raw.ip_address ?? null,
    macAddress: raw.macAddress ?? raw.mac_address ?? null,
    assigneeId: typeof assignee === 'object' && assignee !== null ? String(assignee.id) : assignee ? String(assignee) : null,
    assignedUser: typeof assignee === 'object' && assignee !== null ? assignee : assignee ? { id: String(assignee), name: `Employee #${assignee}` } : null,
    location: typeof loc === 'object' && loc !== null ? loc : loc ? { id: String(loc), name: `Location #${loc}`, type: "Location" } : null,
    purchaseDate: raw.purchaseDate ?? raw.purchase_date ?? raw.installationDate ?? null,
    warrantyExpiry: raw.warrantyExpiry ?? raw.warranty_expiry ?? null,
  };
}

function serializeAssetPayload(data: Partial<Asset>): Record<string, any> {
  const payload: Record<string, any> = { ...data };
  if (data.manufacturer !== undefined) {
    payload.make = data.manufacturer;
    payload.manufacturer = data.manufacturer;
  }
  if (data.serialNumber !== undefined) {
    payload.serial_number = data.serialNumber;
  }
  if (data.assetTag !== undefined) {
    payload.asset_tag = data.assetTag;
  }
  if (data.tag !== undefined && payload.asset_tag === undefined) {
    payload.asset_tag = data.tag;
  }
  if (data.ipAddress !== undefined) {
    payload.ip_address = data.ipAddress;
  }
  if (data.macAddress !== undefined) {
    payload.mac_address = data.macAddress;
  }
  if (data.purchaseDate !== undefined) {
    payload.purchase_date = data.purchaseDate;
  }
  if (data.warrantyExpiry !== undefined) {
    payload.warranty_expiry = data.warrantyExpiry;
  }
  if (data.locationId !== undefined) {
    payload.location_id = data.locationId ? Number(data.locationId) : null;
  }
  if (data.assigneeId !== undefined) {
    payload.assigned_to_id = data.assigneeId ? Number(data.assigneeId) : null;
  }
  return payload;
}

export const assetApi = {
  getAll: async () => {
    const result = await apiFetch<Paginated<any> | any[]>('/assets');
    const rows = Array.isArray(result) ? result : result.data;
    return rows.map(normalizeAsset);
  },
  getOne: async (id: string) => normalizeAsset(await apiFetch<any>(`/assets/${id}`)),
  create: (data: Partial<Asset>) =>
    apiFetch<Asset>('/assets', { method: 'POST', body: JSON.stringify(serializeAssetPayload(data)) }),
  update: (id: string, data: Partial<Asset>) =>
    apiFetch<Asset>(`/assets/${id}`, { method: 'PATCH', body: JSON.stringify(serializeAssetPayload(data)) }),
  remove: (id: string) =>
    apiFetch<void>(`/assets/${id}`, { method: 'DELETE' }),
  reassign: (id: string, assigneeId: string | null, notes?: string) =>
    apiFetch<Asset>(`/assets/${id}/reassign`, { method: 'POST', body: JSON.stringify({ assigneeId, notes }) }),
  retire: (id: string, reason: string, notes?: string) =>
    apiFetch<Asset>(`/assets/${id}/retire`, { method: 'POST', body: JSON.stringify({ reason, notes }) }),
  logEvent: (id: string, event_type: string, description: string) =>
    apiFetch<any>(`/assets/${id}/log`, { method: 'POST', body: JSON.stringify({ event_type, description }) }),
};

// ---------- Inventory API ----------
export interface InventoryItem {
   

  [key: string]: any;
  id: string;
  name: string;
  sku?: string | null;
  category: string;
  quantity: number;
  currentMeterMark?: number;
  minStock: number;
  maxStock: number;
  status?: string | null;
  binLocation?: string | null;
  supplier?: string | null;
}

function serializeInventoryPayload(data: Partial<InventoryItem>): Record<string, any> {
  const payload: Record<string, any> = { ...data };
  if (data.minStock !== undefined) {
    payload.min_stock = data.minStock;
  }
  return payload;
}

export const inventoryApi = {
  getAll: async () => {
    const result = await apiFetch<Paginated<InventoryItem> | InventoryItem[]>('/inventory');
    return Array.isArray(result) ? result : result.data;
  },
  getOne: (id: string) => apiFetch<InventoryItem>(`/inventory/${id}`),
  create: (data: Partial<InventoryItem>) =>
    apiFetch<InventoryItem>('/inventory', { method: 'POST', body: JSON.stringify(serializeInventoryPayload(data)) }),
  update: (id: string, data: Partial<InventoryItem>) =>
    apiFetch<InventoryItem>(`/inventory/${id}`, { method: 'PATCH', body: JSON.stringify(serializeInventoryPayload(data)) }),
  remove: (id: string) =>
    apiFetch<void>(`/inventory/${id}`, { method: 'DELETE' }),
  issueAsset: (id: string, assigneeId: string | null, notes?: string) =>
    apiFetch<any>(`/inventory/${id}/issue-asset`, { method: 'POST', body: JSON.stringify({ assigneeId, notes }) }),
};

// ---------- Repairs API ----------
export interface Repair {
   

  [key: string]: any;
  id: string;
  description: string;
  status: string;
  condition?: string | null;
  remarks?: string | null;
  estimatedCompletion?: string | null;
  hardwareId: string;
  hardware: { id: string; tag: string; make: string; model: string };
  technicianId?: string | null;
  scheduledDate?: string | null;
  completedDate?: string | null;
  type?: string | null;
  technician?: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

function serializeRepairPayload(data: Partial<Repair>): Record<string, any> {
  const payload: Record<string, any> = { ...data };
  if (data.hardwareId !== undefined && payload.asset_id === undefined) {
    payload.asset_id = data.hardwareId;
  }
  if (data.assetId !== undefined) {
    payload.asset_id = data.assetId;
  }
  if (data.technicianId !== undefined) {
    payload.assigned_technician_id = data.technicianId;
  }
  return payload;
}

export const repairsApi = {
  getAll: async () => {
    const result = await apiFetch<Paginated<Repair> | Repair[]>('/repairs');
    return Array.isArray(result) ? result : result.data;
  },
  getOne: (id: string) => apiFetch<Repair>(`/repairs/${id}`),
  create: (data: Partial<Repair>) =>
    apiFetch<Repair>('/repairs', { method: 'POST', body: JSON.stringify(serializeRepairPayload(data)) }),
  update: (id: string, data: Partial<Repair>) =>
    apiFetch<Repair>(`/repairs/${id}`, { method: 'PATCH', body: JSON.stringify(serializeRepairPayload(data)) }),
  remove: (id: string) =>
    apiFetch<void>(`/repairs/${id}`, { method: 'DELETE' }),
  uploadPhoto: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || document.cookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1] : null;
    const headers = new Headers();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const base = await getApiBase();
    const res = await fetch(`${base}/repairs/${id}/photo`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
};

// ---------- Network API ----------
export interface NetworkDevice {
  [key: string]: unknown;
  id: string;
  name?: string;
  hostname: string;
  mac_address: string;
  macAddress?: string;
  ip_address: string;
  ipAddress?: string;
  os?: string | null;
  vendor?: string | null;
  device_type?: string | null;
  deviceType?: string | null;
  status: string;
  connectionStatus?: string | null;
  accessPoint?: string | null;
  last_seen: string;
  lastSeen?: string;
  locationId?: string | null;
  location?: { name?: string } | null;
  networkName?: string | null;
  latency_ms?: number | null;
  latencyMs?: number | null;
  last_ping_at?: string | null;
  consecutive_failures?: number;
  open_ports?: number[];
  snmp_sys_descr?: string;
  monitoring_enabled?: boolean;
  employee?: { id: string; name: string; email: string } | null;
  mapped_asset_name?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScanStatusResponse {
  job_id?: string;
  subnet?: string;
  progress_percent: number;
  total_ips?: number;
  scanned_count: number;
  discovered_count: number;
  discovered_devices?: Array<{
    ip_address: string;
    mac_address: string;
    hostname: string;
    vendor: string;
    device_type: string;
    latency_ms: number;
    open_ports: number[];
  }>;
  is_complete: boolean;
  error?: string | null;
}

export interface PollHealthResponse {
  success: boolean;
  message: string;
  details: {
    polled_count: number;
    online_count: number;
    degraded_count: number;
    offline_count: number;
    tickets_created: number;
  };
}

function serializeNetworkPayload(data: Partial<NetworkDevice>): Record<string, any> {
  const payload: Record<string, any> = { ...data };
  if (data.ipAddress !== undefined) payload.ip_address = data.ipAddress;
  if (data.macAddress !== undefined) payload.mac_address = data.macAddress;
  if (data.deviceType !== undefined) payload.device_type = data.deviceType;
  return payload;
}

export interface TopologyNode {
  id: number;
  label: string;
  ip_address: string;
  mac_address: string;
  device_type: string;
  status: string;
  latency_ms?: number;
  vlan_id?: number;
  is_rogue?: boolean;
  quarantined?: boolean;
  open_ports?: Array<{ port: number; service: string; latency_ms?: number }>;
  vendor?: string;
  cluster: "GATEWAY" | "CORE_SWITCH" | "ACCESS_POINT" | "SERVER" | "CAMERA" | "PRINTER" | "ENDPOINT";
  asset_tag?: string | null;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface TopologyLink {
  id: string;
  source: number | TopologyNode;
  target: number | TopologyNode;
  link_type: "ETHERNET" | "FIBER" | "WIRELESS" | "UPLINK";
  speed_mbps?: number;
  status: "ACTIVE" | "DEGRADED" | "DOWN";
  traffic_load_pct?: number;
  port_source_label?: string;
  port_target_label?: string;
}

export interface TopologyGraphData {
  nodes: TopologyNode[];
  links: TopologyLink[];
  total_nodes: number;
  total_links: number;
  gateway_node_id?: number | null;
}

export interface NOCSummaryData {
  total_managed: number;
  online_count: number;
  degraded_count: number;
  offline_count: number;
  rogue_count: number;
  quarantined_count: number;
  average_latency_ms: number;
  gateway_status: string;
  last_sweep_at?: string | null;
}

export interface ProbeResultData {
  id: number;
  ip_address: string;
  status: string;
  latency_ms: number;
  open_ports: Array<{ port: number; service: string; latency_ms?: number }>;
  consecutive_failures: number;
  last_ping_at?: string | null;
  is_online: boolean;
}

export const nocApi = {
  getTopologyGraph: () => apiFetch<TopologyGraphData>('/devices/topology'),
  getNocSummary: () => apiFetch<NOCSummaryData>('/devices/noc/summary'),
  probeDevice: (id: number | string) =>
    apiFetch<ProbeResultData>(`/devices/${id}/probe`, { method: 'POST' }),
  quarantineDevice: (id: number | string, reason?: string) =>
    apiFetch<{ success: boolean; quarantined: boolean; message: string }>(`/devices/${id}/quarantine`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  autoFileRogueTicket: (id: number | string, priority = 'HIGH', notes?: string) =>
    apiFetch<{ success: boolean; ticket_id: number; tracking_code: string; message: string }>(
      `/devices/${id}/auto-ticket`,
      { method: 'POST', body: JSON.stringify({ priority, notes }) }
    ),
};

export const networkApi = {
  getAll: async () => {
    const result = await apiFetch<Paginated<NetworkDevice> | NetworkDevice[]>('/devices');
    return Array.isArray(result) ? result : result.data;
  },
  getStaged: () => apiFetch<NetworkDevice[]>('/devices/discovery/staged'),
  triggerScan: (payload: { subnet?: string; scanType?: string; devices?: any[] }) =>
    apiFetch<{ message: string; job_id: string; subnet: string; status: string }>(
      '/devices/discovery/scan',
      { method: 'POST', body: JSON.stringify(payload) }
    ),
  getScanStatus: (jobId?: string) =>
    apiFetch<ScanStatusResponse>(
      `/devices/discovery/status${jobId ? `?job_id=${encodeURIComponent(jobId)}` : ''}`
    ),
  promoteDevice: (
    id: string | number,
    payload?: { asset_category?: string; location_id?: number; department_id?: number; asset_name?: string; asset_tag?: string }
  ) =>
    apiFetch<NetworkDevice>(`/devices/discovery/promote/${id}`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    }),
  pollNow: () => apiFetch<PollHealthResponse>('/devices/poll-now', { method: 'POST' }),
  getOne: (id: string) => apiFetch<NetworkDevice>(`/network/${id}`),
  create: (data: Partial<NetworkDevice>) =>
    apiFetch<NetworkDevice>('/network', { method: 'POST', body: JSON.stringify(serializeNetworkPayload(data)) }),
  update: (id: string, data: Partial<NetworkDevice>) =>
    apiFetch<NetworkDevice>(`/network/${id}`, { method: 'PATCH', body: JSON.stringify(serializeNetworkPayload(data)) }),
  remove: (id: string) =>
    apiFetch<void>(`/network/${id}`, { method: 'DELETE' }),
};

// ---------- Dashboard API ----------
export interface DashboardStats {
   

  [key: string]: any;
  kpis: {
    totalHardware: number;
    atRiskHardware: number;
    lowStockItems: number;
    activeNetworkDevices: number;
  };
  activeRepairs: Array<{ id: string; asset: string; issue: string; tech: string; eta: string }>;
  recentActivity: Array<{ action: string; meta: string; type: string; time: string }>;
  transactionTrend: Array<{ day: string; received: number; issued: number }>;
  systemStatus: Array<{ name: string; status: string; uptime: string | null; latency: string | null }>;
}

export const dashboardApi = {
  getStats: () => apiFetch<DashboardStats>('/dashboard/stats'),
};

// ---------- Employees API ----------
export interface Employee {
   

  [key: string]: any;
  id: string;
  name: string;
  email: string;
  department?: string | null;
  position?: string | null;
  office?: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

function serializeEmployeePayload(data: Partial<Employee>): Record<string, any> {
  const payload: Record<string, any> = { ...data };
  if (data.locationId !== undefined) {
    payload.location_id = data.locationId;
  }
  return payload;
}

export const employeesApi = {
  getAll: async () => {
    const result = await apiFetch<Paginated<Employee> | Employee[]>('/employees');
    return Array.isArray(result) ? result : result.data;
  },
  getOne: (id: string) => apiFetch<Employee>(`/employees/${id}`),
  getProfile: (id: string) => apiFetch<any>(`/employees/${id}/profile`),
  create: (data: Partial<Employee>) => apiFetch<Employee>('/employees', { method: 'POST', body: JSON.stringify(serializeEmployeePayload(data)) }),
  update: (id: string, data: Partial<Employee>) => apiFetch<Employee>(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(serializeEmployeePayload(data)) }),
  remove: (id: string) => apiFetch<void>(`/employees/${id}`, { method: 'DELETE' }),
};

export interface Camera {
  id: string | number;
  name: string;
  ip_address: string;
  mac_address?: string;
  vendor?: string;
  model?: string;
  status: string;
  resolution?: string;
}

export interface Connection {
  id: string | number;
  source_device_id: string | number;
  target_device_id: string | number;
  port?: string;
  speed?: string;
  status: string;
}

export interface KnowledgeArticle {
  id: string | number;
  title: string;
  content: string;
  tags?: string[];
  author_name?: string;
  created_at: string;
  updated_at: string;
}

// ---------- Ticket API ----------
export interface TicketComment {
  id: number;
  authorName: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface Ticket {
  id: number;
  tracking_code?: string | null;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  requesterId?: string | null;
  requesterName?: string | null;
  reporter_name?: string | null;
  reporter_email?: string | null;
  department?: string | null;
  location?: string | null;
  location_details?: string | null;
  assetId?: string | null;
  assigneeId?: number | null;
  assigneeName?: string | null;
  dueDate?: string | null;
  createdAt: string;
  comments?: TicketComment[] | null;
}

function serializeTicketPayload(data: Partial<Ticket>): Record<string, any> {
  const payload: Record<string, any> = { ...data };
  if (data.assigneeId !== undefined) {
    payload.assigned_to_id = data.assigneeId;
  }
  if (data.requesterId !== undefined) {
    payload.requester_id = data.requesterId;
  }
  if (data.dueDate !== undefined) {
    payload.due_date = data.dueDate;
  }
  if (data.assetId !== undefined) {
    payload.asset_id = data.assetId;
  }
  return payload;
}

export const ticketsApi = {
  getAll: async () => {
    const result = await apiFetch<Ticket[]>('/tickets');
    return result;
  },
  getOne: (id: string) => apiFetch<Ticket>(`/tickets/${id}`),
  create: (data: Partial<Ticket>) =>
    apiFetch<Ticket>('/tickets', { method: 'POST', body: JSON.stringify(serializeTicketPayload(data)) }),
  update: (id: string, data: Partial<Ticket>) =>
    apiFetch<Ticket>(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(serializeTicketPayload(data)) }),
  assign: (id: string, assigneeId: number | null) =>
    apiFetch<Ticket>(`/tickets/${id}/assign`, { method: 'POST', body: JSON.stringify({ assigneeId }) }),
  addComment: (id: string, content: string, isInternal: boolean, authorId?: number) =>
    apiFetch<Ticket>(`/tickets/${id}/comments`, { method: 'POST', body: JSON.stringify({ content, isInternal, authorId }) }),
};


export interface Location {
   

  [key: string]: any; id: string | number; name: string; parentId?: string | number | null; }
export interface OperationHistoryRecord {
   

  [key: string]: any; id: string | number; }
export interface OperationPayload {
   

  [key: string]: any; }




function serializeLocationPayload(data: Partial<Location>): Record<string, any> {
  const payload: Record<string, any> = { ...data };
  if (data.parentId !== undefined) {
    payload.parent_id = data.parentId;
  }
  return payload;
}

export const locationsApi = {
  getTree: async () => await apiFetch('/locations/tree'),
  getDetails: async (id: string) => await apiFetch(`/locations/${id}/details`),
  getAll: async () => await apiFetch<Location[]>('/locations'),
  getOne: (id: string) => apiFetch<Location>(`/locations/${id}`),
  create: (data: Partial<Location>) =>
    apiFetch<Location>('/locations', { method: 'POST', body: JSON.stringify(serializeLocationPayload(data)) }),
  update: (id: string, data: Partial<Location>) =>
    apiFetch<Location>(`/locations/${id}`, { method: 'PATCH', body: JSON.stringify(serializeLocationPayload(data)) }),
  remove: (id: string) =>
    apiFetch<void>(`/locations/${id}`, { method: 'DELETE' }),
};

export interface OperationJob {
  job_id: string;
  op_type: string;
  status: "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
  progress_percent: number;
  total_items: number;
  processed_items: number;
  message: string;
  details?: Record<string, any>;
  error?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface OperationPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  recommended_async: boolean;
}

export interface ExecuteOperationPayload {
  operation_type: string;
  target_ids?: number[];
  params?: Record<string, any>;
  is_async?: boolean;
}

export interface ExecuteOperationResponse {
  success: boolean;
  job_id?: string;
  status?: string;
  is_async: boolean;
  message: string;
  result?: Record<string, any>;
}

export const operationsApi = {
  getPresets: () => apiFetch<OperationPreset[]>('/operations/presets'),
  getJobs: () => apiFetch<OperationJob[]>('/operations/jobs'),
  getJobStatus: (jobId: string) => apiFetch<OperationJob>(`/operations/jobs/${encodeURIComponent(jobId)}`),
  getHistory: async () => await apiFetch<OperationHistoryRecord[]>('/operations/history').catch(() => []),
  getAll: async () => await apiFetch<any[]>('/operations').catch(() => []),
  execute: async (payload: ExecuteOperationPayload) =>
    await apiFetch<ExecuteOperationResponse>('/operations/execute', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export interface UserSessionRecord {
  session_id: string;
  user_id: number;
  username: string;
  ip_address: string;
  user_agent: string;
  device_info: string;
  created_at: string;
  last_active: string;
  is_revoked: boolean;
}

export interface TestDiagnosticResult {
  success: boolean;
  latency_ms: number;
  status_code?: number;
  message: string;
  diagnostic_logs: string[];
}

export interface SystemTaxonomies {
  categories: string[];
  locations: string[];
  departments: string[];
  statuses: string[];
  priorities: Array<{ id: string; name: string; sla_hours: number }>;
}

export const systemSettingsApi = {
  getSessions: () => apiFetch<UserSessionRecord[]>('/system/sessions'),
  revokeSession: (sessionId: string) =>
    apiFetch<{ success: boolean; message: string }>(`/system/sessions/${encodeURIComponent(sessionId)}/revoke`, {
      method: 'POST',
    }),
  revokeOtherSessions: (sessionId?: string) =>
    apiFetch<{ success: boolean; revoked_count: number; message: string }>('/system/sessions/revoke-others', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    }),
  restoreBackup: (filename: string) =>
    apiFetch<any>('/system/database/backups/restore', {
      method: 'POST',
      body: JSON.stringify({ filename }),
    }),
  testEmail: (data: { smtp_server: string; smtp_port: number; sender_email: string; recipient_email: string; use_tls?: boolean }) =>
    apiFetch<TestDiagnosticResult>('/settings/notifications/test-email', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  testWebhook: (data: { webhook_url: string; service_type?: string }) =>
    apiFetch<TestDiagnosticResult>('/settings/notifications/test-webhook', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getTaxonomies: () => apiFetch<SystemTaxonomies>('/system/taxonomies'),
  updateTaxonomies: (data: Partial<SystemTaxonomies>) =>
    apiFetch<SystemTaxonomies>('/system/taxonomies', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

export interface AvailableEquipmentCategory {
  category: string;
  available_count: number;
  icon: string;
  description: string;
}

export interface EquipmentLoanInPayload {
  requester_name: string;
  requester_email: string;
  requester_id: string;
  requester_phone?: string;
  department?: string;
  purpose: string;
  equipment_category: string;
  expected_return_date: string;
  start_date?: string;
}

export interface EquipmentLoanRecord {
  id: number;
  tracking_code: string;
  requester_name: string;
  requester_email: string;
  requester_id: string;
  requester_phone?: string;
  department?: string;
  purpose: string;
  equipment_category: string;
  specific_asset_name?: string;
  specific_asset_tag?: string;
  start_date: string;
  expected_return_date: string;
  actual_return_date?: string;
  status: "PENDING_APPROVAL" | "APPROVED" | "CHECKED_OUT" | "RETURNED" | "OVERDUE" | "REJECTED" | "CANCELLED";
  technician_notes?: string;
  created_at: string;
}

export interface DiagnosticsPingResponse {
  timestamp: string;
  server_status: string;
  db_latency_ms: number;
  cluster_region: string;
  active_services: Array<{ name: string; status: string; latency: string }>;
}

export interface KnowledgeSuggestResponse {
  id: number;
  title: string;
  category: string;
  summary: string;
  tags: string[];
  match_score: number;
}

export interface KnowledgeArticleRecord {
  id: number;
  title: string;
  content: string;
  tags: string[];
  author_name: string;
  created_at: string;
}

export const portalApi = {
  getAvailableEquipment: () => apiFetch<AvailableEquipmentCategory[]>('/portal/loans/available-equipment'),
  submitLoanRequest: (payload: EquipmentLoanInPayload) =>
    apiFetch<EquipmentLoanRecord>('/portal/loans/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  trackLoan: (code: string) => apiFetch<EquipmentLoanRecord>(`/portal/loans/track/${encodeURIComponent(code)}`),
  cancelLoan: (loanId: number) =>
    apiFetch<{ success: boolean; message: string }>(`/portal/loans/${loanId}/cancel`, {
      method: 'POST',
    }),
  getAllLoans: () => apiFetch<EquipmentLoanRecord[]>('/portal/loans'),
  updateLoanStatus: (loanId: number, data: { status: string; technician_notes?: string; asset_id?: number }) =>
    apiFetch<EquipmentLoanRecord>(`/portal/loans/${loanId}/status`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  pingDiagnostics: () => apiFetch<DiagnosticsPingResponse>('/portal/diagnostics/ping'),
  searchKnowledge: (q: string = '') => apiFetch<KnowledgeArticleRecord[]>(`/portal/knowledge/search?q=${encodeURIComponent(q)}`),
  getKnowledgeSuggestions: (title: string, desc: string) =>
    apiFetch<KnowledgeSuggestResponse[]>(`/portal/knowledge/suggest?title=${encodeURIComponent(title)}&desc=${encodeURIComponent(desc)}`),
};


export interface LocationRow {
  id: string | number;
  name?: string;
  type?: string;
  address?: string;
  capacity?: number;
  parent_location_id?: number | null;
  [key: string]: unknown;
}

export interface InstalledRow {
  id: string | number;
  name?: string;
  version?: string;
  vendor?: string;
  [key: string]: unknown;
}

export interface EmployeeProfile {
  id: number;
  name: string;
  email: string;
  department?: string;
  phone?: string;
  role?: string;
  [key: string]: unknown;
}

export interface TimelineEvent {
  id: string | number;
  action: string;
  module?: string;
  type?: string;
  description?: string;
  timestamp?: string;
  created_at?: string;
  createdAt?: string;
  entity_id?: string | number;
  entityId?: string | number;
  user?: string;
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface GlobalSearchResult {
  assets: Asset[];
  tickets: Ticket[];
  employees: Employee[];
}

export const timelineApi = {
  getTimeline: async (module?: string, limit = 100): Promise<TimelineEvent[]> => {
    try {
      const params = new URLSearchParams();
      if (module) params.set('module', module);
      params.set('limit', String(limit));
      const data = await apiFetch<TimelineEvent[]>(`/timeline?${params}`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
  getEvents: async (module?: string): Promise<TimelineEvent[]> => {
    return timelineApi.getTimeline(module);
  },
};

export const aiApi = {
  ask: async (query: string, context?: unknown) => {
    try {
      const res = await apiFetch<{ text?: string; answer?: string; message?: string }>('/ai/ask', {
        method: 'POST',
        body: JSON.stringify({ query, context }),
      });
      return {
        text: res?.text || res?.answer || res?.message || 'Processed AI query.',
        answer: res?.answer || res?.text || res?.message || 'Processed AI query.',
      };
    } catch {
      return { text: 'AI response processed.', answer: 'AI response processed.' };
    }
  },
  processQuery: async (..._args: unknown[]) => ({ text: '' }),
  chat: async (..._args: unknown[]) => ({ text: '' })
};

export const searchApi = {
  globalSearch: async (query: string): Promise<GlobalSearchResult> => {
    if (!query || query.trim().length < 2) return { assets: [], tickets: [], employees: [] };
    try {
      const data = await apiFetch<GlobalSearchResult>(`/search?q=${encodeURIComponent(query.trim())}`);
      return {
        assets: Array.isArray(data?.assets) ? data.assets : [],
        tickets: Array.isArray(data?.tickets) ? data.tickets : [],
        employees: Array.isArray(data?.employees) ? data.employees : [],
      };
    } catch {
      return { assets: [], tickets: [], employees: [] };
    }
  },
};

// ---------- Accessories API ----------
export interface AccessoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  reorderLevel: number;
  unitCost?: number;
  location: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const accessoriesApi = {
  getAll: async (): Promise<AccessoryItem[]> => {
    const data = await apiFetch<AccessoryItem[]>('/accessories');
    return Array.isArray(data) ? data : [];
  },
  create: (data: Partial<AccessoryItem>) =>
    apiFetch<AccessoryItem>('/accessories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<AccessoryItem>) =>
    apiFetch<AccessoryItem>(`/accessories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) =>
    apiFetch<void>(`/accessories/${id}`, { method: 'DELETE' }),
  dispatch: (id: string, quantity: number, notes?: string) =>
    apiFetch<AccessoryItem>(`/accessories/${id}/dispatch`, { method: 'POST', body: JSON.stringify({ quantity, notes }) }),
  restock: (id: string, quantity: number) =>
    apiFetch<AccessoryItem>(`/accessories/${id}/restock`, { method: 'POST', body: JSON.stringify({ quantity }) }),
};

// ---------- Software API ----------
export interface SoftwareLicense {
  id: string;
  name: string;
  version: string;
  vendor: string;
  totalSeats: number;
  assignedSeats: number;
  costPerSeat?: number;
  expiryDate: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const softwareApi = {
  getAll: async (): Promise<SoftwareLicense[]> => {
    const data = await apiFetch<any>('/software');
    return Array.isArray(data) ? data : [];
  },
  getKpis: () => apiFetch<any>('/software/kpis'),
  create: (data: Partial<SoftwareLicense>) =>
    apiFetch<SoftwareLicense>('/software', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<SoftwareLicense>) =>
    apiFetch<SoftwareLicense>(`/software/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) =>
    apiFetch<void>(`/software/${id}`, { method: 'DELETE' }),
};

export interface KnowledgeDocument {
  id: string;
  title: string;
  content?: string;
  category: string;
  tags?: string[];
  [key: string]: any;
}

export type DocumentCategory = string;

export const knowledgeApi = {
  getAll: async () => await apiFetch<any>('/knowledge'),
  getOne: async (id: string) => await apiFetch<any>(`/knowledge/${id}`),
  create: async (data: any) => await apiFetch<any>('/knowledge', { method: 'POST', body: JSON.stringify(data) }),
  update: async (id: string, data: any) => await apiFetch<any>(`/knowledge/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: async (id: string) => await apiFetch<any>(`/knowledge/${id}`, { method: 'DELETE' }),
};

// ---------- Racks & Cabling API ----------
export interface RackRecord {
  id: number;
  location_id: number;
  location_name: string;
  name: string;
  total_u: number;
  max_power_watts: number;
  max_weight_kg: number;
  status: string;
  notes: string;
  occupied_u: number;
  u_utilization_pct: number;
  total_power_draw_watts: number;
  power_utilization_pct: number;
  mount_count: number;
}

export interface RackMountRecord {
  id: number;
  rack_id: number;
  name: string;
  start_u: number;
  u_height: number;
  orientation: "FRONT" | "REAR";
  power_draw_watts: number;
  asset_id?: number | null;
  asset_tag?: string | null;
  device_id?: number | null;
  device_ip?: string | null;
  device_type?: string | null;
  notes: string;
}

export interface SlotOccupation {
  u_slot: number;
  is_occupied: boolean;
  mount?: RackMountRecord | null;
}

export interface UnmountedHardware {
  type: "ASSET" | "DEVICE";
  id: number;
  name: string;
  category: string;
  asset_tag: string;
  suggested_u: number;
  suggested_watts: number;
}

export interface ElevationData {
  rack: RackRecord;
  slots: SlotOccupation[];
  mounts: RackMountRecord[];
  unmounted_hardware: UnmountedHardware[];
}

export interface PortRecord {
  id: number;
  patch_panel_id?: number | null;
  device_id?: number | null;
  port_number: number;
  port_label: string;
  port_type: string;
  vlan_id: number;
  speed_mbps: number;
  status: "CONNECTED" | "EMPTY" | "FAULTY";
  cable?: {
    cable_id: number;
    peer_port_id: number;
    peer_label: string;
    cable_type: string;
    color: string;
    length_m: number;
  } | null;
}

export interface PatchPanelRecord {
  id: number;
  name: string;
  start_u: number;
  total_ports: number;
  category: string;
  ports: PortRecord[];
}

export interface CableLinkRecord {
  id: number;
  source_port_id: number;
  source_port_label: string;
  target_port_id: number;
  target_port_label: string;
  cable_type: string;
  color: string;
  length_meters: number;
  notes: string;
}

export interface RackPortsAndCabling {
  rack_id: number;
  rack_name: string;
  patch_panels: PatchPanelRecord[];
  cables: CableLinkRecord[];
}

export const racksApi = {
  getAll: (locationId?: number) =>
    apiFetch<RackRecord[]>(locationId ? `/racks?location_id=${locationId}` : '/racks'),
  create: (data: { location_id: number; name: string; total_u?: number; max_power_watts?: number; max_weight_kg?: number; status?: string; notes?: string }) =>
    apiFetch<RackRecord>('/racks', { method: 'POST', body: JSON.stringify(data) }),
  getElevation: (rackId: number) =>
    apiFetch<ElevationData>(`/racks/${rackId}/elevation`),
  mount: (rackId: number, data: { name: string; start_u: number; u_height: number; orientation?: string; power_draw_watts?: number; asset_id?: number; device_id?: number; notes?: string }) =>
    apiFetch<RackMountRecord>(`/racks/${rackId}/mount`, { method: 'POST', body: JSON.stringify(data) }),
  unmount: (rackId: number, mountId: number) =>
    apiFetch<{ success: boolean; message: string }>(`/racks/${rackId}/unmount/${mountId}`, { method: 'DELETE' }),
  getPorts: (rackId: number) =>
    apiFetch<RackPortsAndCabling>(`/racks/${rackId}/ports`),
  createPatchPanel: (rackId: number, data: { name: string; start_u: number; total_ports: number; category?: string }) =>
    apiFetch<{ id: number; name: string; total_ports: number }>(`/racks/${rackId}/patch-panels`, { method: 'POST', body: JSON.stringify(data) }),
  linkCable: (data: { source_port_id: number; target_port_id: number; cable_type?: string; color?: string; length_meters?: number; notes?: string }) =>
    apiFetch<CableLinkRecord>('/racks/cables/link', { method: 'POST', body: JSON.stringify(data) }),
  unlinkCable: (linkId: number) =>
    apiFetch<{ success: boolean; message: string }>(`/racks/cables/unlink/${linkId}`, { method: 'DELETE' }),
};

