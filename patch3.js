const fs = require('fs');
const file = 'apps/web/src/lib/api.ts';
let data = fs.readFileSync(file, 'utf8');

const missing = `
export interface LocationDetails { id: string | number; [key: string]: any; }

export const locationsApi = {
  getTree: async () => await apiFetch('/locations/tree'),
  getDetails: async (id: string) => await apiFetch(\`/locations/\${id}/details\`),
  getAll: async () => await apiFetch('/locations')
};

export const operationsApi = {
  getHistory: async () => await apiFetch('/operations/history'),
  execute: async (payload: any) => await apiFetch('/operations/execute', { method: 'POST', body: JSON.stringify(payload) }),
  getAll: async () => await apiFetch('/operations')
};
`;

// Remove the old locationsApi and operationsApi so I can append the new ones safely
data = data.replace(/export const locationsApi = \{[\s\S]*?\};\n/, '');
data = data.replace(/export const operationsApi = \{[\s\S]*?\};\n/, '');

fs.writeFileSync(file, data + '\n' + missing);
