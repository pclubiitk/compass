package middleware

import (
	"compass/model"
	"github.com/gin-gonic/gin"
)

func UserAuthenticator(c *gin.Context) {
	// Set the user id here
	c.Set("userID", 1234)

	// Set the user role here
	c.Set("role", model.UserRole)

	c.Next()
}

func AdminAuthenticator(c *gin.Context) {
	// Call the UserAuthenticator to get the userid and role in the request

	// verify the role
	c.Next()
}
