const fs = require('fs');
const file = 'apps/web/src/lib/api.ts';
let data = fs.readFileSync(file, 'utf8');

if (!data.includes('registry.getApiExtensions')) {
  data = data.replace('export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {', 
`import { registry } from '@/lib/core';\n
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const extensions = registry.getApiExtensions();
  for (const ext of extensions) {
    if (path.startsWith(ext.matchPrefix)) {
      return await ext.handler(path, options) as T;
    }
  }
`);
  fs.writeFileSync(file, data);
}
