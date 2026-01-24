package search

import (
	"compass/middleware"

	"github.com/gin-gonic/gin"
)

func Router(r *gin.Engine) {
    search := r.Group("/api/search")
    search.Use(middleware.UserAuthenticator)

    search.POST("/toggleVisibility", toggleVisibility)
    search.DELETE("/", deleteProfileData)

    protected := search.Group("/") 
    protected.Use(middleware.CheckVisibility)
    {
        protected.GET("/", getAllProfiles)
        protected.POST("/changeLog", getChangeLog)
    }
}
