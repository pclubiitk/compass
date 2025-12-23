package middleware

import (
	"net/url"
	"strings"

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

		// We need to parse the origin to get just the hostname
		parsedOrigin, err := url.Parse(origin)
		if err != nil {
			c.Next()
			return
		}
		hostname := parsedOrigin.Hostname()

		// 1. Allow localhost for development (you can be more specific with the port)
		// 2. Allow the main domain (e.g., "pclub.in")
		// 3. Allow any subdomain (e.g., "auth.pclub.in")
		if hostname == "localhost" || hostname == viper.GetString("domain") || strings.HasSuffix(hostname, "."+viper.GetString("domain")) {

			// Other method:
			// c.Writer.Header().Set("Access-Control-Allow-Origin", "*") // For Production: // all origin or our domain
			// c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000") // For development only, Read it from env

			// If it's an allowed origin, set the header to that exact origin
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true") // To all credentials
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
