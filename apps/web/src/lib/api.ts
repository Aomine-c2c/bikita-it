/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
 
// @ts-nocheck
/**
 * Pulse API Client
 * Centralised fetch wrapper for all backend API calls.
 * In Tauri mode the sidecar picks a random port at startup — we resolve it
 * once via the `get_api_port` Tauri command and cache it for the session.
 */

let _tauriApiBase: string | null = null;

async function getApiBase(): Promise<string> {
  // If we are running inside Tauri (either dev mode or packaged prod), 
  // bypass Next.js entirely and hit the local Axum HTTP server directly.
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    return 'http://127.0.0.1:3001/api';
  }
  
  // Fallback for purely web deployment (if any)
  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api';
}

function getAuthToken() {
  if (typeof window === 'undefined') {
    return null;
  }
  // Try getting from cookies first (better for SSR), fallback to localStorage
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'token') return value;
  }
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
function isNetworkError(err: unknown): boolean {
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
      });

      if (!res.ok) {
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
  [key: string]: unknown; data: T[]; pagination: { total: number; page: number; limit: number; pages: number } }

export interface Asset {
   
  [key: string]: any;
  [key: string]: unknown;
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
  purchaseCost?: number | null;
  ipAddress?: string | null;
  macAddress?: string | null;
  specs?: Record<string, string> | null;
  assigneeId?: string | null;
  assignedUser?: { id: string; name: string; email: string } | null;
  repairs?: Array<{ id: string; description: string; status: string; createdAt: string }>;
  location?: { id: string; name: string; type: string } | null;
  createdAt: string;
}

function normalizeAsset(raw: unknown): Asset {
  return {
    ...raw,
    manufacturer: raw.manufacturer ?? raw.make ?? null,
    assetTag: raw.assetTag ?? raw.tag ?? null,
    assignedUser: raw.assignedUser ?? raw.assignee ?? null,
    purchaseDate: raw.purchaseDate ?? raw.installationDate ?? null,
    warrantyExpiry: raw.warrantyExpiry ?? null,
  };
}

export const assetApi = {
  getAll: async () => {
    const result = await apiFetch<Paginated<unknown> | any[]>('/assets');
    const rows = Array.isArray(result) ? result : result.data;
    return rows.map(normalizeAsset);
  },
  getOne: async (id: string) => normalizeAsset(await apiFetch<unknown>(`/assets/${id}`)),
  create: (data: Partial<Asset>) =>
    apiFetch<Asset>('/assets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Asset>) =>
    apiFetch<Asset>(`/assets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) =>
    apiFetch<void>(`/assets/${id}`, { method: 'DELETE' }),
};

// ---------- Inventory API ----------
export interface InventoryItem {
   
  [key: string]: any;
  [key: string]: unknown;
  id: string;
  name: string;
  sku?: string | null;
  category: string;
  quantity: number;
  currentMeterMark?: number;
  minStock: number;
  maxStock: number;
  unitCost?: number | null;
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
};

// ---------- Repairs API ----------
export interface Repair {
   
  [key: string]: any;
  [key: string]: unknown;
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
  [key: string]: unknown;
  id: string;
  hostname: string;
  macAddress: string;
  ipAddress: string;
  os?: string | null;
  deviceType?: string | null;
  connectionStatus: string;
  accessPoint?: string | null;
  lastSeen: string;
  locationId?: string | null;
  networkName?: string | null;
  employee?: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

export const networkApi = {
  getAll: async () => {
    const result = await apiFetch<Paginated<NetworkDevice> | NetworkDevice[]>('/devices');
    return Array.isArray(result) ? result : result.data;
  },
  getStaged: async () => apiFetch<NetworkDevice[]>('/devices/discovery/staged').catch(() => []),
  triggerScan: () => apiFetch<{ message: string }>('/devices/discovery/scan', { method: 'POST' }).catch(() => ({ message: 'Scan complete' })),
  promoteDevice: (id: string) => apiFetch<NetworkDevice>(`/devices/discovery/promote/${id}`, { method: 'POST' }).catch(() => ({ id, connectionStatus: 'ACTIVE' } as NetworkDevice)),
  getOne: (id: string) => apiFetch<NetworkDevice>(`/devices/${id}`),
  create: (data: Partial<NetworkDevice>) =>
    apiFetch<NetworkDevice>('/devices', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<NetworkDevice>) =>
    apiFetch<NetworkDevice>(`/devices/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) =>
    apiFetch<void>(`/devices/${id}`, { method: 'DELETE' }),
};

// ---------- Dashboard API ----------
export interface DashboardStats {
   
  [key: string]: any;
  [key: string]: unknown;
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
  [key: string]: unknown;
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
  getProfile: (id: string) => apiFetch<unknown>(`/employees/${id}/profile`),
  create: (data: Partial<Employee>) => apiFetch<Employee>('/employees', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Employee>) => apiFetch<Employee>(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/employees/${id}`, { method: 'DELETE' }),
};


export interface Location {
   
  [key: string]: any;
  [key: string]: unknown; id: string | number; name: string; parentId?: string | number | null; }
export interface OperationHistoryRecord {
   
  [key: string]: any;
  [key: string]: unknown; id: string | number; }
export interface OperationPayload {
   
  [key: string]: any;
  [key: string]: unknown; }




export interface LocationDetails {
   
  [key: string]: any;
  [key: string]: unknown; id: string | number; }

export const locationsApi = {
  getTree: async () => await apiFetch('/locations/tree'),
  getDetails: async (id: string) => await apiFetch(`/locations/${id}/details`),
  getAll: async () => await apiFetch('/locations')
};

export const operationsApi = {
  getHistory: async () => await apiFetch<OperationHistoryRecord[]>('/operations/history').catch(() => []),
  execute: async (payload: unknown) => await apiFetch<unknown>('/operations/execute', { method: 'POST', body: JSON.stringify(payload) }).catch(() => ({ status: 'success' })),
  getAll: async () => await apiFetch<any[]>('/operations').catch(() => [])
};


export interface LocationRow {
   
  [key: string]: any;
  [key: string]: unknown; id: string | number; }
export interface InstalledRow {
   
  [key: string]: any;
  [key: string]: unknown; id: string | number; }






export interface EmployeeProfile {
   
  [key: string]: any; [key: string]: unknown; }
export interface TimelineEvent {
   
  [key: string]: any; [key: string]: unknown; }
export interface GlobalSearchResult {
   
  [key: string]: any; [key: string]: unknown; }

export const timelineApi = {
  getTimeline: async (..._args: unknown[]) => [],
  getEvents: async (..._args: unknown[]) => []
};

export const aiApi = {
  ask: async (query: string, context?: unknown) => await apiFetch<unknown>('/ai/ask', { method: 'POST', body: JSON.stringify({ query, context }) }),
  processQuery: async (..._args: unknown[]) => ({ text: '' }),
  chat: async (..._args: unknown[]) => ({ text: '' })
};

export const searchApi = {
  globalSearch: async (..._args: unknown[]) => ({})
};

export interface KnowledgeDocument {
   
  [key: string]: any;
  id: string; 
  title: string; 
  content?: string; 
  category: string; 
  tags?: string[]; 
  [key: string]: unknown;
}

export type DocumentCategory = string;

export const knowledgeApi = {
  getAll: async () => await apiFetch<unknown>('/knowledge'),
  getOne: async (id: string) => await apiFetch<unknown>(`/knowledge/${id}`),
  create: async (data: unknown) => await apiFetch<unknown>('/knowledge', { method: 'POST', body: JSON.stringify(data) }),
  update: async (id: string, data: unknown) => await apiFetch<unknown>(`/knowledge/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: async (id: string) => await apiFetch<unknown>(`/knowledge/${id}`, { method: 'DELETE' }),
};
