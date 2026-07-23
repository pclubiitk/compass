package middleware

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
)

// Later update this to the config or some better way
// var MapsUnderDev = false
var MapsUnderDev = viper.GetBool("underdev.map")

func UnderDev(c *gin.Context, location string) {
	switch location {
	case "maps":
		if MapsUnderDev {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "We are currently under development"})
		}
	}
	// more cases to be added if needed later
}
