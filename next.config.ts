import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  images: {
    domains: ["th.bing.com", "www.iitk.ac.in", "localhost", "shantsagar"],
  },
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: "http://localhost:8080/api/auth/:path*",
      },
      {
        source: "/api/profile/:path*",
        destination: "http://localhost:8080/api/profile/:path*",
      },
      // Map other services if needed, assuming user runs them locally
    ];
  },
};

export default nextConfig;
