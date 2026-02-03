package assets

import (
	"compass/middleware"

	"github.com/gin-gonic/gin"
)

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
	{
		protected.Static("/pfp", "./assets/pfp")
		protected.POST("/assets", uploadAsset)
	}

	// Admin only routes
	admin := r.Group("/")
	admin.Use(middleware.UserAuthenticator, middleware.EmailVerified, middleware.AdminAuthenticator)
	{
		admin.Static("/tmp", "./assets/tmp")
	}
}
