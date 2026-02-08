// Initialize routes related to authentication: /login, /signup, /logout
// Use handlers defined in a separate file
package auth

import (
	"compass/middleware"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
)

func Router(r *gin.Engine) {
	auth := r.Group("/api/auth")
	{
		auth.POST("/login", loginHandler)
		auth.POST("/signup", signupHandler)
		auth.GET("/logout", logoutHandler)
		auth.GET("/verify", verificationHandler)
		auth.POST("/forgot-password", forgotPasswordHandler)
		auth.POST("/reset-password", resetPasswordHandler)
		// Middleware will handel not login state
		auth.GET("/me", middleware.UserAuthenticator, func(c *gin.Context) {
			val, exists := c.Get("visibility")

			// ensure it exists and is a boolean
			isVisible, ok := val.(bool)
			if !exists || !ok {
				// fallback
				isVisible = false
			}

			puppyLoveEnabled := viper.GetBool("puppylove.enabled")

			if isVisible {
				if puppyLoveEnabled {
					// 200: logged in + visible + puppylove enabled
					c.JSON(http.StatusOK, gin.H{"success": true})
				} else {
					// 203: logged in + visible + puppylove disabled
					c.JSON(http.StatusNonAuthoritativeInfo, gin.H{"success": true, "status": "puppylove_disabled"})
				}
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
		profile.POST("/pfp", UploadProfileImage)
		profile.GET("/oa", autoC)
	}

}
