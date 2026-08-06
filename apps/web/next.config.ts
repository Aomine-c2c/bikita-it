import type { NextConfig } from 'next';

const AXUM_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://127.0.0.1:3001';

const nextConfig: NextConfig = {
  output: 'export',
  poweredByHeader: false,

  // Image optimization for static export
  images: {
    unoptimized: true, // Required for static export (Tauri)
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production (keep error/warn for observability)
    removeConsole: {
      exclude: ['error', 'warn'],
    },
  },

  // Proxy all /api/* calls to the local Axum HTTP server in dev mode.
  // Static export (production/Tauri build) ignores rewrites — direct fetch is used instead.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${AXUM_URL}/api/:path*`,
      },
    ];
  },

  // Experimental performance features
  experimental: {
    // Optimize package imports for large icon/component libraries (tree-shaking)
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'recharts',
      '@radix-ui/react-label',
      '@radix-ui/react-slot',
    ],
  },
};

export default nextConfig;
