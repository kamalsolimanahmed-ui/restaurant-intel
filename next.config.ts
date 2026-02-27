import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Silence Turbopack warning - using Turbopack (default in Next.js 16)
  turbopack: {},
};

export default nextConfig;
