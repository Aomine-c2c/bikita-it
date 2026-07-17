const base = process.env.PREVIEW_URL ?? 'http://127.0.0.1:3000';
const response = await fetch(base, { signal: AbortSignal.timeout(10000) });
if (!response.ok) throw new Error(`Preview returned ${response.status}`);
const html = await response.text();
if (!html.includes('Xiphos')) throw new Error('Expected product name was not rendered');
console.log(`Smoke test passed: ${base} (${response.status})`);
