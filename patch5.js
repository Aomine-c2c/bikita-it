const fs = require('fs');
const file = 'apps/web/src/lib/api.ts';
let data = fs.readFileSync(file, 'utf8');

// Regex to insert [key: string]: any; into every interface in api.ts
data = data.replace(/export interface ([A-Za-z0-9_]+)\s*(?:<[^>]*>)?\s*\{/g, (match, name) => {
  return `${match}\n  [key: string]: any;`;
});

fs.writeFileSync(file, data);
