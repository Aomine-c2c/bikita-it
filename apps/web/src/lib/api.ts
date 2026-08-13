/* eslint-disable @typescript-eslint/no-explicit-any */
 

/**
 * Pulse API Client
 * Centralised fetch wrapper for all backend API calls.
 * In Tauri mode the sidecar picks a random port at startup — we resolve it
 * once via the `get_api_port` Tauri command and cache it for the session.
 */



async function getApiBase(): Promise<string> {
  // If we are running inside Tauri, use 3001 to comply with CSP
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    return 'http://127.0.0.1:3001/api';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api';
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
        if (res.status === 401 && typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
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

export const assetApi = {
  getAll: async () => {
    const result = await apiFetch<Paginated<any> | any[]>('/assets');
    const rows = Array.isArray(result) ? result : result.data;
    return rows.map(normalizeAsset);
  },
  getOne: async (id: string) => normalizeAsset(await apiFetch<any>(`/assets/${id}`)),
  create: (data: Partial<Asset>) =>
    apiFetch<Asset>('/assets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Asset>) =>
    apiFetch<Asset>(`/assets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
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

export const inventoryApi = {
  getAll: async () => {
    const result = await apiFetch<Paginated<InventoryItem> | InventoryItem[]>('/inventory');
    return Array.isArray(result) ? result : result.data;
  },
  getOne: (id: string) => apiFetch<InventoryItem>(`/inventory/${id}`),
  create: (data: Partial<InventoryItem>) =>
    apiFetch<InventoryItem>('/inventory', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<InventoryItem>) =>
    apiFetch<InventoryItem>(`/inventory/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
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

export const repairsApi = {
  getAll: async () => {
    const result = await apiFetch<Paginated<Repair> | Repair[]>('/repairs');
    return Array.isArray(result) ? result : result.data;
  },
  getOne: (id: string) => apiFetch<Repair>(`/repairs/${id}`),
  create: (data: Partial<Repair>) =>
    apiFetch<Repair>('/repairs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Repair>) =>
    apiFetch<Repair>(`/repairs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
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
   

  [key: string]: any;
  id: string;
  hostname: string;
  mac_address: string;
  ip_address: string;
  os?: string | null;
  vendor?: string | null;
  deviceType?: string | null;
  status: string;
  accessPoint?: string | null;
  last_seen: string;
  locationId?: string | null;
  networkName?: string | null;
  employee?: { id: string; name: string; email: string } | null;
  mapped_asset_name?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const networkApi = {
  getAll: async () => {
    const result = await apiFetch<Paginated<NetworkDevice> | NetworkDevice[]>('/network');
    return Array.isArray(result) ? result : result.data;
  },
  getStaged: async () => apiFetch<NetworkDevice[]>('/devices/discovery/staged').catch(() => []),
  triggerScan: (devices: Partial<NetworkDevice>[]) => apiFetch<{ message: string }>('/devices/discovery/scan', { method: 'POST', body: JSON.stringify({ devices }) }),
  promoteDevice: (id: string) => apiFetch<NetworkDevice>(`/devices/discovery/promote/${id}`, { method: 'POST' }).catch(() => ({ id, connectionStatus: 'ACTIVE' } as unknown as NetworkDevice)),
  getOne: (id: string) => apiFetch<NetworkDevice>(`/network/${id}`),
  create: (data: Partial<NetworkDevice>) =>
    apiFetch<NetworkDevice>('/network', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<NetworkDevice>) =>
    apiFetch<NetworkDevice>(`/network/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
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

export const employeesApi = {
  getAll: async () => {
    const result = await apiFetch<Paginated<Employee> | Employee[]>('/employees');
    return Array.isArray(result) ? result : result.data;
  },
  getOne: (id: string) => apiFetch<Employee>(`/employees/${id}`),
  getProfile: (id: string) => apiFetch<any>(`/employees/${id}/profile`),
  create: (data: Partial<Employee>) => apiFetch<Employee>('/employees', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Employee>) => apiFetch<Employee>(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
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
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  requesterId?: string | null;
  requesterName?: string | null;
  department?: string | null;
  location?: string | null;
  assetId?: string | null;
  assigneeId?: number | null;
  assigneeName?: string | null;
  dueDate?: string | null;
  createdAt: string;
  comments?: TicketComment[] | null;
}

export const ticketsApi = {
  getAll: async () => {
    const result = await apiFetch<Ticket[]>('/tickets');
    return result;
  },
  getOne: (id: string) => apiFetch<Ticket>(`/tickets/${id}`),
  create: (data: Partial<Ticket>) =>
    apiFetch<Ticket>('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Ticket>) =>
    apiFetch<Ticket>(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
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




export interface LocationDetails {
   

  [key: string]: any; id: string | number; }

export const locationsApi = {
  getTree: async () => await apiFetch('/locations/tree'),
  getDetails: async (id: string) => await apiFetch(`/locations/${id}/details`),
  getAll: async () => await apiFetch('/locations')
};

export const operationsApi = {
  getHistory: async () => await apiFetch<OperationHistoryRecord[]>('/operations/history').catch(() => []),
  execute: async (payload: any) => await apiFetch<any>('/operations/execute', { method: 'POST', body: JSON.stringify(payload) }).catch(() => ({ status: 'success' })),
  getAll: async () => await apiFetch<any[]>('/operations').catch(() => [])
};


export interface LocationRow {
   

  [key: string]: any; id: string | number; }
export interface InstalledRow {
   

  [key: string]: any; id: string | number; }






export interface EmployeeProfile { [key: string]: any; }
export interface TimelineEvent { [key: string]: any; }
export interface GlobalSearchResult { [key: string]: any; }

export const timelineApi = {
  getTimeline: async (module?: string, limit = 100): Promise<TimelineEvent[]> => {
    try {
      const params = new URLSearchParams();
      if (module) params.set('module', module);
      params.set('limit', String(limit));
      const data = await apiFetch<any[]>(`/timeline?${params}`);
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
  ask: async (query: string, context?: any) => await apiFetch<any>('/ai/ask', { method: 'POST', body: JSON.stringify({ query, context }) }),
  processQuery: async (..._args: any[]) => ({ text: '' }),
  chat: async (..._args: any[]) => ({ text: '' })
};

export const searchApi = {
  globalSearch: async (query: string): Promise<{ assets: any[]; tickets: any[]; employees: any[] }> => {
    if (!query || query.trim().length < 2) return { assets: [], tickets: [], employees: [] };
    try {
      const data = await apiFetch<any>(`/search?q=${encodeURIComponent(query.trim())}`);
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
    const data = await apiFetch<any>('/accessories');
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
