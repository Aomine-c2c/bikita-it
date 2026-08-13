/* eslint-disable @typescript-eslint/no-explicit-any */
 

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch, getApiBase, assetApi } from './api';

// Mock the global fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('API Client Core', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('window', undefined);
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001/api');
  });

  it('getApiBase returns expected URL for SSR/dev', async () => {
    const base = await getApiBase();
    expect(base).toBe('http://localhost:3001/api');
  });

  it('apiFetch throws error on non-200 responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    });

    await expect(apiFetch('/test')).rejects.toThrow('API Error 500: Internal Server Error');
  });

  it('apiFetch returns parsed JSON on success', async () => {
    const mockData = { success: true, id: 123 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await apiFetch('/test');
    expect(result).toEqual(mockData);
  });
});

describe('Asset API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('getOne normalizes raw asset data', async () => {
    const rawAsset = {
      id: 'A-123',
      name: 'Server A',
      category: 'SERVER',
      status: 'ACTIVE',
      createdAt: '2025-01-01',
      make: 'Dell', // Should map to manufacturer
      assignee: { id: 'U-1', name: 'John Doe', email: 'john@example.com' } // Should map to assignedUser
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(rawAsset),
    });

    const result = await assetApi.getOne('A-123');
    expect(result.manufacturer).toBe('Dell');
    expect(result.assignedUser?.name).toBe('John Doe');
  });
});
