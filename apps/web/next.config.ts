import type { NextConfig } from 'next';

const apiOrigin = process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:3001';
const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Content-Security-Policy', value: isProd
          ? "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; form-action 'self'; img-src 'self' data: blob:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' http://api:3001; upgrade-insecure-requests"
          : "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; form-action 'self'; img-src 'self' data: blob:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self'; upgrade-insecure-requests"
        },
      ],
    }];
  },
  rewrites: async () => [{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }],
};
export default nextConfig;
