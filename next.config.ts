import type { NextConfig } from "next";
import withPWA from "next-pwa";
const SEARCH_URL = process.env.NEXT_PUBLIC_SEARCH_DOMAIN;

const nextConfig: NextConfig = {
  /* config options here */

  images: {
    // FIXME(prod): comment or false this in prod, used to fetch images hosted on localhost during dev
    // dangerouslyAllowLocalIP: true,
    domains: ["localhost", "pclub.in"],
  },
  turbopack: {
    root: "./",
  },
  async rewrites() {
    return [
      {
        source: "/students/:path*",
        destination: `${SEARCH_URL}/:path*`,
      },
      {
        source: "/_next/:path*",
        has: [
          {
            type: "header",
            key: "referer",
            value: ".*/students(?:/.*)?$",
          },
        ],
        destination: `${SEARCH_URL}/_next/:path*`,
      },
    ];
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
})(nextConfig);
