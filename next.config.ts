import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "th.bing.com" },
      { protocol: "https", hostname: "www.iitk.ac.in" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "shantsagar" },
    ],
  },

  // Default to local auth backend in development when env var not set
  env: {
    NEXT_PUBLIC_AUTH_URL:
      process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8080",
  },
};

export default nextConfig;
