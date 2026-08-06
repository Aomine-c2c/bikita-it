import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
test('frontend uses same-origin API by default', () => { const source=fs.readFileSync(new URL('../src/lib/api.ts', import.meta.url),'utf8'); assert.match(source, /NEXT_PUBLIC_API_URL \|\| 'http:\/\/127\.0\.0\.1:3001\/api'/); });
