package search

import (
	"compass/connections"
	"compass/model"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func getAllProfiles(c *gin.Context) {
	// This request may be slow,
	// TODO: Better way if possible, reddis be dekh sak te he.
	var profiles []model.Profile
	if err := connections.DB.Find(&profiles, "visibility = ?", true).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch profiles."})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Profiles retrieved successfully", "profiles": profiles})
}

func getChangeLog(c *gin.Context) {
	var input changeLogRequest
	var requestTime = time.Now()
	// Request Validation
	if err := c.ShouldBindJSON(&input); err != nil {
		// Adding the request time format
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "requestTime": requestTime})
		return
	}
	// Generate the json form the logs
	var addUserId []uuid.UUID
	var deleteUserId []uuid.UUID

	// Retrieve only un expired changelogs after last update time for user
	if err := connections.DB.Model(model.ChangeLog{}).
		Where("created_at > ? AND action = ?", input.LastUpdateTime, model.Add).
		Pluck("user_id", &addUserId).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch 'add' updates if any."})
		return
	}
	if err := connections.DB.Model(model.ChangeLog{}).
		Where("created_at > ? AND action = ?", input.LastUpdateTime, model.Delete).
		Pluck("user_id", &deleteUserId).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch 'delete' updates if any."})
		return
	}
	var newProfiles []model.Profile
	if err := connections.DB.Where("user_id IN ?", addUserId).Find(&newProfiles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve new profiles"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Updates fetched successfully.", "addProfiles": newProfiles, "deleteUserId": deleteUserId, "requestTime": requestTime})

}
