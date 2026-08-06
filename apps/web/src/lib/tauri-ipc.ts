/* eslint-disable @typescript-eslint/ban-ts-comment */
 
 
// @ts-nocheck
export async function handleTauriIpc<T>(path: string, method: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');

    if (path === '/setup/check') {
      return (await invoke('check_setup')) as T;
    }
    if (path === '/setup/initialize') {
      const body = options.body ? JSON.parse(options.body as string) : {};
      return (await invoke('initialize_setup', body)) as T;
    }
    if (path === '/auth/login') {
      const body = options.body ? JSON.parse(options.body as string) : {};
      const user = await invoke('login', { email: body.email, password: body.password });
      return {
        access_token: 'local-desktop-token',
        user
      } as T;
    }
    if (path === '/auth/cache/invalidate') {
      return { success: true } as T;
    }
    if (path === '/dashboard/stats') {
      const stats = await invoke('get_dashboard_stats');
      return stats as T;
    }

    // Handle generic CRUD operations for standard entities
    const crudEntities = [
      { route: '/assets', name: 'asset', getCmd: 'get_assets' },
      { route: '/inventory', name: 'inventory_item', getCmd: 'get_inventory' },
      { route: '/employees', name: 'employee', getCmd: 'get_employees' },
      { route: '/locations', name: 'location', getCmd: 'get_locations' },
      { route: '/repairs', name: 'repair', getCmd: 'get_repairs' },
      { route: '/network', name: 'connected_device', getCmd: 'get_connected_devices' }
    ];

    for (const entity of crudEntities) {
      if (path === entity.route) {
        if (method === 'GET') return (await invoke(entity.getCmd)) as T;
        if (method === 'POST') {
          const body = options.body ? JSON.parse(options.body as string) : {};
          return (await invoke(`create_${entity.name}`, { data: body })) as T;
        }
      } else if (path.startsWith(`${entity.route}/`)) {
        const parts = path.split('/');
        if (parts.length === 3) {
          const id = parts[2];
          if (method === 'GET') {
            const all: unknown[] = await invoke(entity.getCmd);
            const found = all.find((x: unknown) => x.id === id);
            if (!found) throw new Error("404 Not Found");
            return found as T;
          }
          if (method === 'PATCH') {
            const body = options.body ? JSON.parse(options.body as string) : {};
            return (await invoke(`update_${entity.name}`, { id, data: body })) as T;
          }
          if (method === 'DELETE') {
            return (await invoke(`delete_${entity.name}`, { id })) as T;
          }
        }
      }
    }

    if (path.startsWith('/employees/') && path.endsWith('/profile')) {
      const id = path.split('/')[2];
      const profile: unknown = await invoke('get_employee_profile', { id });
      return profile as T;
    }
    if (path.startsWith('/assets/') && path.endsWith('/maintenance')) {
      const assetId = path.split('/')[2];
      if (method === 'POST') {
        const body = options.body ? JSON.parse(options.body as string) : {};
        return (await invoke('log_maintenance_activity', { 
          assetId, 
          activityType: body.type, 
          description: body.description, 
          technicianId: body.technicianId,
          newCondition: body.condition
        })) as T;
      } else {
        return (await invoke('get_asset_maintenance_history', { assetId })) as T;
      }
    }
    if (path.startsWith('/assets/') && path.endsWith('/condition')) {
      const assetId = path.split('/')[2];
      const body = options.body ? JSON.parse(options.body as string) : {};
      return (await invoke('update_asset_condition', { 
        assetId, 
        condition: body.condition,
        notes: body.notes
      })) as T;
    }
    if (path === '/devices/discovery/staged') {
      return [] as T;
    }
    if (path === '/devices/discovery/scan') {
      return { success: true } as T;
    }
    if (path === '/operations/history' || path === '/operations') {
      return (await invoke('get_operations_history')) as T;
    }
    if (path === '/operations/execute') {
      const body = options.body ? JSON.parse(options.body as string) : {};
      return (await invoke('execute_operation', { 
          operationType: body.operationType, 
          entityId: body.hardwareAssetId || body.inventoryItemId || body.locationId || body.assigneeId || "", 
          notes: body.notes || ""
      })) as T;
    }
    if (path === '/get_software_licenses' || path === 'get_software_licenses') {
      return (await invoke('get_software_licenses')) as T;
    }
    if (path === '/get_helpdesk_tickets' || path === 'get_helpdesk_tickets') {
      return (await invoke('get_helpdesk_tickets')) as T;
    }
    if (path === '/get_report_charts_data' || path === 'get_report_charts_data') {
      return (await invoke('get_report_charts_data')) as T;
    }
    if (path.startsWith('/users')) {
      return (await invoke('get_employees')) as T;
    }
    if (path.startsWith('/locations/tree')) {
      const locations: unknown[] = await invoke('get_locations');
      const locMap = new Map();
      locations.forEach(l => locMap.set(l.id, { ...l, children: [] }));
      const tree: unknown[] = [];
      locations.forEach(l => {
        if (l.parent_id) {
          const parent = locMap.get(l.parent_id);
          if (parent) {
            parent.children.push(locMap.get(l.id));
          } else {
            tree.push(locMap.get(l.id));
          }
        } else {
          tree.push(locMap.get(l.id));
        }
      });
      return tree as T;
    }
    
    // If no route matches, return null so we can fallback to HTTP fetch
    return null;
  } catch (err: unknown) {
    console.warn('Tauri IPC call failed, falling back to HTTP fetch:', err);
    return null;
  }
}
