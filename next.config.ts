import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/introduce",
        destination: "http://localhost:8080/api/introduce",
      },
      {
        source: "/api/introduce/:path*",
        destination: "http://localhost:8080/api/introduce/:path*",
      },
    ];
  },
};

export default nextConfig;
