const fs = require('fs');
const file = 'apps/web/src/lib/api.ts';
let data = fs.readFileSync(file, 'utf8');

const missing = `
export interface Location { id: string | number; name: string; parentId?: string | number | null; }
export interface OperationHistoryRecord { id: string | number; [key: string]: any; }
export interface OperationPayload { [key: string]: any; }

export const locationsApi = {
  getTree: async () => await apiFetch('/locations/tree'),
  getDetails: async (id: string) => await apiFetch(\`/locations/\${id}/details\`)
};

export const operationsApi = {
  getHistory: async () => await apiFetch('/operations/history'),
  execute: async (payload: any) => await apiFetch('/operations/execute', { method: 'POST', body: JSON.stringify(payload) })
};
`;

fs.writeFileSync(file, data + '\n' + missing);
