const fs = require('fs');

const missingExports = `
export interface EmployeeProfile { [key: string]: any; }
export interface TimelineEvent { [key: string]: any; }
export interface GlobalSearchResult { [key: string]: any; }

export const timelineApi = {
  getTimeline: async () => [],
  getEvents: async () => []
};

export const aiApi = {
  processQuery: async () => ({}),
  chat: async () => ({})
};

export const searchApi = {
  globalSearch: async () => ({})
};
`;

const file = 'apps/web/src/lib/api.ts';
let data = fs.readFileSync(file, 'utf8');

// Strip out the previous missingExports I appended in patch6.js
data = data.replace(/export interface EmployeeProfile[\s\S]*/, '');

// Fix duplicate index signature
data = data.replace(/\[key: string\]: any;\s*\[key: string\]: any;/g, '[key: string]: any;');

// Re-append the missing exports
fs.writeFileSync(file, data + '\n' + missingExports);
