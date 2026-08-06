const fs = require('fs');
const file = 'apps/web/src/lib/api.ts';
let data = fs.readFileSync(file, 'utf8');

const missing = `
export interface LocationRow { id: string | number; [key: string]: any; }
export interface InstalledRow { id: string | number; [key: string]: any; }
`;

fs.writeFileSync(file, data + '\n' + missing);
