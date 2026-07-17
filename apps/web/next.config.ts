import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const apiOrigin = process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:3001';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { unoptimized: true },
  rewrites: async () => [{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }],
};
export default nextConfig;
