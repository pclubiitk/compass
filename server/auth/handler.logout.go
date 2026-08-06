package auth

import (
	"compass/middleware"
	"net/http"

	"github.com/gin-gonic/gin"
)

func logoutHandler(c *gin.Context) {
	if err := middleware.RevokeSession(c); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to revoke session"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Logged Out Successfully"})
}
