/**
 * Xiphos API Client
 * Centralised fetch wrapper for all backend API calls.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API Error ${res.status}: ${error}`);
  }

  return res.json() as Promise<T>;
}

// ---------- Asset API ----------
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
  location?: { id: string; name: string; type: string } | null;
  createdAt: string;
}

export const assetApi = {
  getAll: () => apiFetch<Asset[]>('/assets'),
  getOne: (id: string) => apiFetch<Asset>(`/assets/${id}`),
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
  getAll: () => apiFetch<InventoryItem[]>('/inventory'),
};
