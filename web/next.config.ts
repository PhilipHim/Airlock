import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  async redirects() {
    return [{ source: "/akte", destination: "/file", permanent: false }];
  },
};

export default nextConfig;
