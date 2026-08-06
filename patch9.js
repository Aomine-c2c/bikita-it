const fs = require('fs');

const missingExports = `
export interface EmployeeProfile { [key: string]: any; }
export interface TimelineEvent { [key: string]: any; }
export interface GlobalSearchResult { [key: string]: any; }

export const timelineApi = {
  getTimeline: async (...args: any[]) => [],
  getEvents: async (...args: any[]) => []
};

export const aiApi = {
  processQuery: async (...args: any[]) => ({ text: '' }),
  chat: async (...args: any[]) => ({ text: '' })
};

export const searchApi = {
  globalSearch: async (...args: any[]) => ({})
};
`;

const file = 'apps/web/src/lib/api.ts';
let data = fs.readFileSync(file, 'utf8');

// Strip out the previous missingExports
data = data.replace(/export interface EmployeeProfile[\s\S]*/, '');

// Manually replace the duplicate index signatures in LocationDetails and OperationHistoryRecord
data = data.replace(/export interface LocationDetails \{ id: string \| number; \[key: string\]: any; \[key: string\]: any; \}/g, 'export interface LocationDetails { id: string | number; [key: string]: any; }');
data = data.replace(/export interface OperationHistoryRecord \{ id: string \| number; \[key: string\]: any; \[key: string\]: any; \}/g, 'export interface OperationHistoryRecord { id: string | number; [key: string]: any; }');

// Just in case it was OperationPayload
data = data.replace(/export interface OperationPayload \{ \[key: string\]: any; \[key: string\]: any; \}/g, 'export interface OperationPayload { [key: string]: any; }');


fs.writeFileSync(file, data + '\n' + missingExports);
