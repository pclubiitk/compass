package maps

import (
	"compass/connections"
	"compass/model"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func FuzzySearchNoticesHandler(c *gin.Context) {

	query := c.Query("query")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query is required"})
		return
	}

	const (
		defaultLimit = 20
		maxLimit     = 100
	)

	limit := defaultLimit

	if raw := c.Query("limit"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed < 1 || parsed > maxLimit {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "limit must be between 1 and 100",
			})
			return
		}
		limit = parsed
	}

	var notices []model.Notice
	db := connections.DB

	err := db.Raw(`
		SELECT *, 
		       greatest(
	           similarity(title, ?),
	           similarity(description, ?),
	           similarity(entity, ?)
	       ) AS score
	FROM notices
	WHERE deleted_at IS NULL
	  AND greatest(
	      similarity(title, ?),
	      similarity(description, ?),
	      similarity(entity, ?)
	  ) > 0.1
	ORDER BY score DESC
	LIMIT ?
	`, query, query, query, query, query, query, limit).Scan(&notices).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notices", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"results": notices})
}
