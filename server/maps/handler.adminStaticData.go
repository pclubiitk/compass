package maps

import (
	"compass/connections"
	"compass/model"
	"net/http"

	"github.com/gin-gonic/gin"
)

func systemLogsProvider(c *gin.Context) {
	// static data, provide the logs, try to modify the route such that you enable pagination

}

func flaggedReviewsProvider(c *gin.Context) {
	var reviews []model.Review

	if err := connections.DB.
		Preload("User", connections.UserSelect).
		Preload("Images").
		Where("status = ?", model.RejectedByBot).
		Order("created_at DESC").
		Find(&reviews).Error; err != nil {
		c.JSON(500, gin.H{"error": "Database error", "details": err.Error()})
		return
	}

	c.JSON(200, gin.H{"flagged_reviews": reviews})
}

func locationRequestProvider(c *gin.Context) {
	// filter the pending location requests
	var pending []model.Location

	// Here only admin can accept or reject so just check pending
	err := connections.DB.
		Model(&model.Location{}).
		Preload("User", connections.UserSelect).
		Preload("CoverPic", connections.ImageSelect).
		Where("status = ?", "pending").
		Find(&pending).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch pending location requests"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"requests": pending})
}

func indicatorProvider(c *gin.Context) {
	// add helper functions, and provide the indicators to the user
	// TODO: Later extend it to the have websocket
}
