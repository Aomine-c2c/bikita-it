/**
 * Xiphos Tauri IPC Client
 * 
 * In Tauri desktop mode, calls the bundled NestJS sidecar via HTTP.
 * Falls back to the NestJS HTTP API when running in a browser (dev mode).
 */

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
let apiPort: number | null = null;

export async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  let baseUrl = '';

  if (isTauri) {
    const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
    
    if (command === 'check_for_update' || command === 'install_update' || command === 'get_api_port') {
      return tauriInvoke<T>(command, args);
    }
    
    if (!apiPort) {
      apiPort = await tauriInvoke<number>('get_api_port');
    }
    baseUrl = `http://127.0.0.1:${apiPort}`;
  }

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
  if (!route) {
    if (isTauri) {
      // Fallback: try rust native command if not mapped
      const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
      return tauriInvoke<T>(command, args);
    }
    throw new Error(`No HTTP fallback for Tauri command: ${command}`);
  }

  const url = baseUrl + route.path;
  const res = await fetch(url, {
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
