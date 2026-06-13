import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Garment photos arrive as base64 JSON bodies from the iOS app
  experimental: {
    serverActions: { bodySizeLimit: "15mb" },
  },
};

export default nextConfig;
