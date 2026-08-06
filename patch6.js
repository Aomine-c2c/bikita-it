const fs = require('fs');

const missingExports = `
export interface EmployeeProfile { [key: string]: any; }
export interface TimelineEvent { [key: string]: any; }
export interface GlobalSearchResult { [key: string]: any; }

export const timelineApi = {
  getEvents: async () => []
};

export const aiApi = {
  chat: async () => ({})
};

export const searchApi = {
  globalSearch: async () => ({})
};
`;

const file = 'apps/web/src/lib/api.ts';
let data = fs.readFileSync(file, 'utf8');
data = data.replace(/\[key: string\]: any;\n\s*\[key: string\]: any;/g, '[key: string]: any;');
fs.writeFileSync(file, data + '\n' + missingExports);
