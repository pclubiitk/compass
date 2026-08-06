package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
)

// Manage all cors settings here

func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Origin header from the request
		origin := c.Request.Header.Get("Origin")
		if origin == "" {
			c.Next()
			return
		}

		// Trust only the configured frontend origin. In production this is
		// https://search.pclub.in; development and staging must configure their
		// own exact origin explicitly.
		if origin == viper.GetString("frontend_url") {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
			c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, PATCH") // allowed methods
		}

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204) // return without any response
			return
		}
		c.Next()
	}
}

// Issue in development:
// When you set Access-Control-Allow-Credentials to true, you're telling the browser
// it's okay to send sensitive information like cookies or Authorization headers with the request.

// For security, the browser enforces a strict rule:
// if credentials are involved, the server must explicitly state exactly which origin it trusts.
// A wildcard (*) means "I trust everyone," which is too dangerous when credentials are being sent.
// The server must specify the exact frontend domain that is allowed to make these credentialed requests.
