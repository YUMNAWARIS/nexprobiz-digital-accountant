import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@fa/contracts'],
  experimental: { optimizePackageImports: ['@mui/material', '@mui/icons-material'] },
};
export default nextConfig;
