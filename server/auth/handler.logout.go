package auth

import (
	"compass/middleware"
	"net/http"

	"github.com/gin-gonic/gin"
)

func logoutHandler(c *gin.Context) {
	middleware.ClearAuthCookie(c)
	c.JSON(http.StatusOK, gin.H{"message": "Logged Out Successfully"})
}
