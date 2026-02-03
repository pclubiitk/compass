package assets

import (
	"compass/middleware"

	"github.com/gin-gonic/gin"
)

// TODO: Due to cloudflare's caching layer the images are cached, causing it return image directly and not checking our routing mechanism
// Below are the possible headers to set and setter function
// private = CDNs/proxies must NOT cache (only user's browser can)
// no-cache = must revalidate with origin before serving
// no-store = don't store in any cache
// must-revalidate = enforce strict cache validation
// // noCacheMiddleware sets headers to prevent CDN/browser caching for protected assets
// func noCacheMiddleware() gin.HandlerFunc {
// 	return func(c *gin.Context) {
// 		c.Header("Cache-Control", "private, no-cache, no-store, must-revalidate")
// 		c.Header("Pragma", "no-cache")
// 		c.Header("Expires", "0")
// 		c.Next()
// 	}
// }

func Router(r *gin.Engine) {

	// We handle the no image found on frontend
	// Static Route to provide the images (public, no auth required)
	r.Static("/assets", "./assets/public")
	// TODO: Make it more formal, this limit
	// TODO: set up for images, for image upload, if the similarity is > 90,can ignore it (can think)
	r.MaxMultipartMemory = 5 << 20
	// r.MaxMultipartMemory = 8 << 20

	// Protected routes - require login and verified email to:
	// 1. upload image,
	// 2. view the profile pictures of other users.
	protected := r.Group("/")
	protected.Use(middleware.UserAuthenticator, middleware.EmailVerified)
	// protected.Use(middleware.UserAuthenticator, middleware.EmailVerified, noCacheMiddleware())
	{
		protected.Static("/pfp", "./assets/pfp")
		protected.POST("/assets", uploadAsset)
	}

	// Admin only routes
	admin := r.Group("/")
	admin.Use(middleware.UserAuthenticator, middleware.EmailVerified, middleware.AdminAuthenticator)
	// admin.Use(middleware.UserAuthenticator, middleware.EmailVerified, middleware.AdminAuthenticator, noCacheMiddleware())
	{
		admin.Static("/tmp", "./assets/tmp")
	}
}
