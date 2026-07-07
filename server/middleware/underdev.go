package middleware

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
)

var MapsUnderDev = viper.GetString("env") != "dev"

func UnderDev(c *gin.Context, location string) {
	switch location {
	case "maps":
		if MapsUnderDev {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "We are currently under development"})
		}
	}
	// more cases to be added if needed later
}
