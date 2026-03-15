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
};

export default nextConfig;
