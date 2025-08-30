package middleware

import "github.com/gin-gonic/gin"

// Manage all cors settings here

func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")         // all origin // all origin or localhost:3000?
		// The value of the 'Access-Control-Allow-Origin' 
		// header in the response must not be the wildcard '*' 
		// when the request's credentials mode is 'include'
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true") // To all credentials
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE") // allowed methods

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204) // return without any response
			return
		}
		c.Next()
	}
}
