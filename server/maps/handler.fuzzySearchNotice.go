package maps

import (
	"compass/connections"
	"compass/model"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
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

	type rankedNotice struct {
		NoticeID uuid.UUID `gorm:"column:notice_id"`
	}

	var ranked []rankedNotice
	db := connections.DB

	err := db.Raw(`
			SELECT notice_id,
			       greatest(
		           similarity(title, ?),
		           similarity(description, ?),
		           similarity(body, ?),
		           similarity(entity, ?),
		           similarity(location, ?)
		       ) AS score
		FROM notices
		WHERE deleted_at IS NULL
		  AND greatest(
		      similarity(title, ?),
		      similarity(description, ?),
		      similarity(body, ?),
		      similarity(entity, ?),
		      similarity(location, ?)
		  ) > 0.1
		ORDER BY score DESC
		LIMIT ?
		`, query, query, query, query, query, query, query, query, query, query, limit).Scan(&ranked).Error

	if err != nil {
		logrus.WithError(err).Error("Fuzzy notice search failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notices"})
		return
	}

	if len(ranked) == 0 {
		c.JSON(http.StatusOK, gin.H{"results": []noticeResponse{}})
		return
	}

	ids := make([]uuid.UUID, 0, len(ranked))
	for _, item := range ranked {
		ids = append(ids, item.NoticeID)
	}

	var notices []model.Notice
	if err := db.
		Preload("CoverPic").
		Preload("BioPics").
		Where("notice_id IN ?", ids).
		Find(&notices).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notices"})
		return
	}

	byID := make(map[uuid.UUID]model.Notice, len(notices))
	for _, notice := range notices {
		byID[notice.NoticeId] = notice
	}

	ordered := make([]model.Notice, 0, len(ranked))
	for _, item := range ranked {
		if notice, ok := byID[item.NoticeID]; ok {
			ordered = append(ordered, notice)
		}
	}

	c.JSON(http.StatusOK, gin.H{"results": publicNotices(ordered)})
}
