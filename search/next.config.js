/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
	dest:"public",
	disable:false,
	runtimeCaching: [//next-pwa selects first matching pattern - check cache.js in the next-pwa github repo to see the default list
	//issue: workbox does not cache POST requests - or does it???
// 		{ //these two need to be here so that pictures/etc. are not cached
// 		  urlPattern: /^http:\/\/home\.iitk\.ac\.in\/.*/i, //home.iitk.ac.in - should not be cached
// 		  handler: 'NetworkOnly',
// 		  options: {
// 		  	cacheName: "home.iitk.ac.in",
// 		  },
// 		},
// 		{
// 		  urlPattern: /^https:\/\/oa\.cc\.iitk\.ac\.in\/.*/i, //https://oa.cc.iitk.ac.in - should not be cached either
// 		  handler: 'NetworkOnly',
// 		  options: {
// 		  	cacheName: "oa.cc.iitk.ac.in",
// 		  },
// 		},
// 		{
// 		  urlPattern: ({ url }) => {
// 			const isSameOrigin = self.origin === url.origin
// 			return !isSameOrigin
// 		  },
// 		  handler: 'CacheFirst',
// 		  method: "POST",
// 		  options: {
// 			cacheName: 'cross-origin', //i.e. the mongodb calls
// 			expiration: {
// 			  maxEntries: 4,
// 			  maxAgeSeconds: 60 * 60 * 24 // 1 day
// 			},
// 		  }
// 		}
	]
})

const nextConfig = {
  reactStrictMode: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
//   async redirects() {
//   	return [{ //redirect all other pages to the index page i.e. url.com/bla -> url.com
//   		source: "/:params([^]{1,})", //this matches *any* non-zero length string - has to be non-zero otherwise will infinitely redirect
//   		destination: "/",
//   		permanent: true
//   	}]
//   }
}

module.exports = withPWA(nextConfig)
