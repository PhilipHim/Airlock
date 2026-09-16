import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  async redirects() {
    return [
      { source: "/file", destination: "/", permanent: false },
      { source: "/akte", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
