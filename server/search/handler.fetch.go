package search

import (
	"compass/connections"
	"compass/model"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// TODO: Make this production ready
// This will save the time when the server was started, we will return this time to the frontend, if the last fetched time was before the server restart time then it will drop the db, it is helpful for developer mode to ensure the db changes are are updated in the search, as our manual changes do not create any changeLog.
var serverStartTime = time.Now()

func getAllProfiles(c *gin.Context) {
	// This request may be slow,
	// TODO: Better way if possible, reddis be dekh sak te he.
	// TODO: check if we truly need the distinct on check here and below
	// var profiles []model.ProfileWithPic
	// if err := connections.DB.
	// 	Table("profiles").
	// 	Select("DISTINCT ON (profiles.user_id) profiles.*, users.profile_pic").
	// 	Joins("LEFT JOIN users ON users.user_id = profiles.user_id").
	// 	Where("profiles.visibility = ? AND profiles.deleted_at IS NULL", true).
	// 	Order("profiles.user_id, profiles.updated_at DESC").
	// 	Scan(&profiles).Error; err != nil {
	// 	c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch profiles."})
	// 	return
	// }

	var requestTime = time.Now()
	var profiles []model.Profile

	if err := connections.DB.Find(&profiles, "visibility = ?", true).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch profiles."})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Profiles retrieved successfully", "profiles": profiles, "requestTime": requestTime})
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

	// If the server start time is after the last fetched time form the user, update the db completely
	if input.LastUpdateTime.Before(serverStartTime) {
		var profiles []model.Profile
		if err := connections.DB.Find(&profiles, "visibility = ?", true).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch profiles."})
			return
		}
		c.JSON(http.StatusAccepted, gin.H{"message": "Completely updating local database due to server restart", "profiles": profiles, "requestTime": requestTime, "dropData": true})
		return
	}
	// Generate the json form the logs
	var addUserId []uuid.UUID // Refers to update in the change log
	var deleteUserId []uuid.UUID

	// Retrieve only un expired changelogs after last update time for user
	if err := connections.DB.Model(model.ChangeLog{}).
		Where("created_at > ? AND action = ?", input.LastUpdateTime, model.Update).
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

	// // Initialize to empty slices (not nil) so JSON marshals as [] instead of null
	// newProfiles := []model.ProfileWithPic{}
	// deleteUserIdStrings := []string{}

	// // Only query if there are user IDs to fetch
	// if len(addUserId) > 0 {
	// 	if err := connections.DB.
	// 		Table("profiles").
	// 		Select("DISTINCT ON (profiles.user_id) profiles.*, users.profile_pic").
	// 		Joins("LEFT JOIN users ON users.user_id = profiles.user_id").
	// 		Where("profiles.user_id IN ? AND profiles.deleted_at IS NULL", addUserId).
	// 		Order("profiles.user_id, profiles.updated_at DESC").
	// 		Scan(&newProfiles).Error; err != nil {
	// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve new profiles"})
	// 		return
	// 	}
	// }

	// // Convert UUIDs to strings for frontend
	// for _, id := range deleteUserId {
	// 	deleteUserIdStrings = append(deleteUserIdStrings, id.String())
	// }

	// c.JSON(http.StatusOK, gin.H{"message": "Updates fetched successfully.", "addProfiles": newProfiles, "deleteUserId": deleteUserIdStrings, "requestTime": requestTime})

}
