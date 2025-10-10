import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  images: {
    domains: ["th.bing.com", "www.iitk.ac.in", "localhost"],
  },
  experimental: {
    serverActions: {},
  },
};

export default nextConfig;
