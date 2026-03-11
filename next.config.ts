import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Increase body size limit for video upload API
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
};

export default nextConfig;
