package maps

import (
	"compass/connections"
	"compass/model"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func FuzzySearchLocationsHandler(c *gin.Context) {
	// Getting query param
	query := c.Query("query")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query is required"})
		return
	}

	limit := 10
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	var locations []model.Location
	db := connections.DB

	// Fuzzy search using similarity
	err := db.Raw(`
        SELECT *, similarity(name, ?) AS score
        FROM locations
        WHERE similarity(name, ?) > 0.4
        ORDER BY score DESC
        LIMIT ?
    `, query, query, limit).Scan(&locations).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch locations", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"results": locations})
}

//we will send top 10 results with similarity threshold of 0.4
