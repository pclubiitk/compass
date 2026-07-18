import type { NextConfig } from "next";
import withPWA from "next-pwa";
const SEARCH_URL = process.env.NEXT_PUBLIC_SEARCH_DOMAIN 

const nextConfig: NextConfig = {
  /* config options here */

  images: {
    // FIXME(prod): comment or false this in prod, used to fetch images hosted on localhost during dev 
    // dangerouslyAllowLocalIP: true,
    domains: ["th.bing.com", "www.iitk.ac.in", "localhost", "shantsagar"],
  },
  async rewrites(){

    return [
      {
        source: "/students/:path*",
        destination: `${SEARCH_URL}/students/:path*`,
      }
    ]
  }

};


export default withPWA({
dest: "public",
register: true,
skipWaiting: true,
})(nextConfig); 
