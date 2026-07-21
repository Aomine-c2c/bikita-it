/**
 * Xiphos API Client
 * Centralised fetch wrapper for all backend API calls.
 * In Tauri mode the sidecar picks a random port at startup — we resolve it
 * once via the `get_api_port` Tauri command and cache it for the session.
 */

let _tauriApiBase: string | null = null;

async function getApiBase(): Promise<string> {
  // SSR / Next.js server context — never Tauri
  if (typeof window === 'undefined') return '/api';

  // Running inside Tauri desktop app
  if ((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__) {
    if (!_tauriApiBase) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const port: number = await invoke('get_api_port');
        _tauriApiBase = `http://127.0.0.1:${port}/api`;
        
        // Wait for sidecar to be ready (up to 10 seconds)
        for (let i = 0; i < 20; i++) {
          try {
            const res = await fetch(`${_tauriApiBase}/setup/check`);
            if (res.ok) break;
          } catch {
            await new Promise(r => setTimeout(r, 500));
          }
        }
      } catch {
        // Fallback if invoke fails (e.g., dev mode without Tauri)
        _tauriApiBase = `http://127.0.0.1:3001/api`;
      }
    }
    return _tauriApiBase;
  }

  // Plain browser / Next.js dev server
  return process.env.NEXT_PUBLIC_API_URL || '/api';
}

function getAuthToken() {
  if (typeof window === 'undefined') {
    return null;
  }
  // Try getting from cookies first (better for SSR), fallback to localStorage
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'token') return value;
  }
  return localStorage.getItem('token');
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base = await getApiBase();
  const url = `${base}${path}`;
  const token = getAuthToken();

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

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
}

// Export the helper so login page can use it without duplicating the logic
export { getApiBase };


// ---------- Asset API ----------
export interface Paginated<T> { data: T[]; pagination: { total: number; page: number; limit: number; pages: number } }

export interface Asset {
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
  assignedUser?: { id: string; name: string; email: string } | null;
  repairs?: Array<{ id: string; description: string; status: string; createdAt: string }>;
  location?: { id: string; name: string; type: string } | null;
  createdAt: string;
}

function normalizeAsset(raw: any): Asset {
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
};

// ---------- Inventory API ----------
export interface InventoryItem {
  id: string;
  name: string;
  sku?: string | null;
  category: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  unitCost?: number | null;
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
  id: string;
  description: string;
  status: string;
  condition?: string | null;
  remarks?: string | null;
  estimatedCompletion?: string | null;
  hardwareId: string;
  hardware: { id: string; tag: string; make: string; model: string };
  technicianId?: string | null;
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
  id: string;
  hostname: string;
  macAddress: string;
  ipAddress: string;
  os?: string | null;
  deviceType?: string | null;
  connectionStatus: string;
  accessPoint?: string | null;
  lastSeen: string;
  employee?: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

export const networkApi = {
  getAll: async () => {
    const result = await apiFetch<Paginated<NetworkDevice> | NetworkDevice[]>('/network');
    return Array.isArray(result) ? result : result.data;
  },
  getStaged: async () => apiFetch<NetworkDevice[]>('/network/discovery/staged'),
  triggerScan: () => apiFetch<{ message: string }>('/network/discovery/scan', { method: 'POST' }),
  promoteDevice: (id: string) => apiFetch<NetworkDevice>(`/network/discovery/promote/${id}`, { method: 'POST' }),
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
};
