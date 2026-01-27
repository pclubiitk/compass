package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Later update this to the config or some better way
var MapsUnderDev = true

func UnderDev(c *gin.Context, location string) {
	switch location {
	case "maps":
		if MapsUnderDev {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "We are currently under development"})
		}
	}
	// more cases to be added if needed later
}
