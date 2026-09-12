import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@fa/contracts'],
  experimental: { optimizePackageImports: ['@mui/material', '@mui/icons-material'] },
};
export default withNextIntl(nextConfig);
