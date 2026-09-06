import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@kasahouse/shared-types'],
  images: {
    // Cloudinary-delivered listing media.
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
  },
};

export default nextConfig;
