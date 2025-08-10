package auth

import (
	"compass/middleware"

	"github.com/gin-gonic/gin"
)

func logoutHandler(c *gin.Context) {
	middleware.ClearAuthCookie(c)
}
