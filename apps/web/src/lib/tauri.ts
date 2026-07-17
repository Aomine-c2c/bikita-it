/**
 * Xiphos Tauri IPC Client
 * 
 * In Tauri desktop mode, calls invoke() to talk to the Rust backend.
 * Falls back to the HTTP API when running in a browser (dev mode).
 * 
 * Usage:
 *   import { invoke } from '@/lib/tauri';
 *   const assets = await invoke('get_assets');
 */

// Detect if we're inside Tauri WebView
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/**
 * Universal invoke — works in both Tauri and browser dev mode.
 * Tauri: calls IPC command on Rust backend
 * Browser: proxies to the NestJS HTTP API
 */
export async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauri) {
    // In Tauri — directly invoke Rust commands
    const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
    return tauriInvoke<T>(command, args);
  }

  // In browser dev mode — fall back to HTTP API
  const apiPath = command
    .replace(/_/g, '-')
    .replace(/^get-/, '/api/')
    .replace(/^create-/, '/api/');

  // Map Tauri commands to HTTP endpoints
  const routeMap: Record<string, { method: string; path: string }> = {
    check_setup:       { method: 'GET',  path: '/api/setup/check' },
    initialize_setup:  { method: 'POST', path: '/api/setup/initialize' },
    get_dashboard_stats:{ method: 'GET',  path: '/api/dashboard' },
    get_assets:        { method: 'GET',  path: '/api/assets' },
    create_asset:      { method: 'POST', path: '/api/assets' },
    get_inventory:     { method: 'GET',  path: '/api/inventory' },
    get_employees:     { method: 'GET',  path: '/api/employees' },
    get_locations:     { method: 'GET',  path: '/api/locations' },
    get_repairs:       { method: 'GET',  path: '/api/repairs' },
    get_connected_devices:{ method: 'GET',  path: '/api/network' },
    seed_demo_data:    { method: 'POST', path: '/api/seed' },
  };

  const route = routeMap[command];
  if (!route) throw new Error(`No HTTP fallback for Tauri command: ${command}`);

  const res = await fetch(route.path, {
    method: route.method,
    headers: { 'Content-Type': 'application/json' },
    body: route.method === 'POST' && args ? JSON.stringify(args) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API Error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}
