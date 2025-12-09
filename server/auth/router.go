// Initialize routes related to authentication: /login, /signup, /logout
// Use handlers defined in a separate file
package auth

import (
	"compass/middleware"
	"net/http"

	"github.com/gin-gonic/gin"
)

func Router(r *gin.Engine) {
	auth := r.Group("/api/auth")
	{
		auth.POST("/login", loginHandler)
		auth.POST("/signup", signupHandler)
		auth.GET("/logout", logoutHandler)
		auth.GET("/verify", verificationHandler)
		// Middleware will handel not login state
		auth.GET("/me", middleware.UserAuthenticator, func(c *gin.Context) {
			// c.JSON(200, gin.H{"success": true})
			val, exists := c.Get("visibility")
    
			// ensure it exists and is a boolean
			isVisible, ok := val.(bool)
			if !exists || !ok {
				// fallback
				isVisible = false 
			}

			if isVisible {
				// 200: logged in + visible
				c.JSON(http.StatusOK, gin.H{"success": true})
			} else {
				// 202: logged in + hidden 
				c.JSON(http.StatusAccepted, gin.H{"success": true, "status": "hidden"})
			}
		})
	}
	profile := r.Group("/api/profile")
	{
		profile.Use(middleware.UserAuthenticator)
		profile.GET("", getProfileHandler)
		profile.POST("", updateProfile)
	}
}
