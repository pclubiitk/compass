package maps

import (
	"compass/connections"
	"compass/model"
	"net/http"
	"github.com/gin-gonic/gin"
	"strconv"
)

func FuzzySearchNoticesHandler(c *gin.Context) {
	
	query := c.Query("query")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query is required"})
		return
	}

	limit := 20
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	var notices []model.Notice
	db := connections.DB

	err := db.Raw(`
		SELECT *, 
		       greatest(similarity(title, ?), similarity(description, ?), similarity(entity, ?)) AS score
		FROM notices
		WHERE greatest(similarity(title, ?), similarity(description, ?), similarity(entity, ?)) > 0.4
		ORDER BY score DESC
		LIMIT ?
	`, query, query, query, query, query, query, limit).Scan(&notices).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notices", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"results": notices})
}
