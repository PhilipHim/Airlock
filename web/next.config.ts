import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/akte", destination: "/file", permanent: false }];
  },
};

export default nextConfig;
