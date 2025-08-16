package assets

import (
	"compass/middleware"

	"github.com/gin-gonic/gin"
)

func Router(r *gin.Engine) {

	// Static Route to provide the images
	r.Static("/assets", "./assets/public")

	// TODO: Make it more formal, this limit
	r.MaxMultipartMemory = 5 << 20

	// r.MaxMultipartMemory = 8 << 20

	// Require login to upload image
	r.Use(middleware.UserAuthenticator, middleware.EmailVerified)
	r.POST("/assets", uploadAsset)
}
