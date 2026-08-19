import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '../../'),
  },
  output: 'export',
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

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

  // Experimental performance features
  experimental: {
    // Optimize package imports for large icon/component libraries (tree-shaking)
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@radix-ui/react-label',
      '@radix-ui/react-slot',
    ],
  },
};

export default nextConfig;
