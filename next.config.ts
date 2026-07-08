import type { NextConfig } from "next";

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
        destination: "http://localhost:3000/students/:path*",
      }


    ]
  }



};


export default nextConfig;
