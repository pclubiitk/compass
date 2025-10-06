package search

import (
	"compass/middleware"

	"github.com/gin-gonic/gin"
)

func Router(r *gin.Engine) {
	search := r.Group("/api/search")
	{
		search.Use(middleware.UserAuthenticator)
		search.GET("/", getAllProfiles)
		search.GET("/changeLog", getChangeLog)
		search.POST("/toggleVisibility", toggleVisibility)
		search.DELETE("/", deleteProfileData)
	}
}
