import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@kasahouse/shared-types'],
  images: {
    // Serve Cloudinary media directly from its CDN, sized per layout.
    loader: 'custom',
    loaderFile: './src/lib/cloudinary-loader.ts',
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
    // Cache resized results at the edge for a day.
    minimumCacheTTL: 86400,
  },
};

export default nextConfig;
