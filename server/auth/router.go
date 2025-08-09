// Initialize routes related to authentication: /login, /signup, /logout
// Use handlers defined in a separate file
package auth

import (
	"compass/middleware"

	"github.com/gin-gonic/gin"
)

func Router(r *gin.Engine) {
	auth := r.Group("/api/auth")
	{
		auth.POST("/login", loginHandler)
		auth.POST("/signup", signupHandler)
		auth.GET("/logout", logoutHandler)
		auth.GET("/verify", verificationHandler)
	}
	profile := r.Group("/profile")
	{
		profile.Use(middleware.UserAuthenticator)
		profile.GET("", getProfileHandler)
		profile.POST("", updateProfile)
	}
}
