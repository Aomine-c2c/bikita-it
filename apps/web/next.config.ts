import type { NextConfig } from 'next';
const apiOrigin = process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:3001';
const nextConfig: NextConfig = {
  output: 'export',
  poweredByHeader: false,
  // rewrites are not supported with output: 'export'
  // rewrites: async () => [{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }],
};
export default nextConfig;
