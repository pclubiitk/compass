// Initialize routes related to authentication: /login, /signup, /logout
// Use handlers defined in a separate file
package auth

import (
	"compass/middleware"

	"github.com/gin-gonic/gin"
)

func Router(r *gin.Engine) {
	r.Static("/public", "./public") //added for addition of profile images in public folder
	auth := r.Group("/api/auth")
	{
		auth.POST("/login", loginHandler)
		auth.POST("/signup", signupHandler)
		auth.GET("/logout", logoutHandler)
		auth.GET("/verify", verificationHandler)
		// Middleware will handel not login state
		auth.GET("/me", middleware.UserAuthenticator, func(c *gin.Context) {
			c.JSON(200, gin.H{"success": true})
		})
	}
	profile := r.Group("/profile")
	{
		profile.Use(middleware.UserAuthenticator)
		profile.GET("", getProfileHandler)
		profile.POST("", updateProfile)
		profile.POST("/upload-image", UploadProfileImage)
	}
}
