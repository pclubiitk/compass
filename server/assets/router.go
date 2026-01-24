package assets

import (
	"compass/middleware"

	"github.com/gin-gonic/gin"
)

func Router(r *gin.Engine) {

	// We handle the no image found on frontend
	// Static Route to provide the images
	r.Static("/assets", "./assets/public")
	// TODO: Make it more formal, this limit
	r.MaxMultipartMemory = 5 << 20
	// r.MaxMultipartMemory = 8 << 20

	// Require login to
	// 1. upload image,
	// 2. view the profile pictures of other users.
	r.Use(middleware.UserAuthenticator, middleware.EmailVerified)
	r.Static("/pfp", "./assets/pfp")
	r.POST("/assets", uploadAsset)

	// Admin can see tmp files too
	r.Use(middleware.AdminAuthenticator)
	r.Static("/tmp", "./assets/tmp")
}
