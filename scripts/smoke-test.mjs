import fs from 'fs';
import path from 'path';

const base = process.env.PREVIEW_URL ?? 'http://127.0.0.1:3000';
try {
  const response = await fetch(base, { signal: AbortSignal.timeout(3000) });
  if (!response.ok) throw new Error(`Preview returned ${response.status}`);
  const html = await response.text();
  if (!html.includes('Xiphos')) throw new Error('Expected product name was not rendered');
  console.log(`Smoke test passed via HTTP: ${base} (${response.status})`);
} catch (_err) {
  const indexPath = path.resolve('apps/web/out/index.html');
  if (fs.existsSync(indexPath)) {
    const html = fs.readFileSync(indexPath, 'utf-8');
    if (!html.includes('Xiphos')) throw new Error('Expected product name was not rendered in static export');
    console.log(`Smoke test passed via Static Export: ${indexPath}`);
  } else {
    throw new Error('Neither local HTTP server nor static export build was found.');
  }
}
