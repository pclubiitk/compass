package search

import (
	"compass/connections"
	"compass/directorycache"
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
	// Filter by visibility=true AND department is not null/empty to reduce dataset
	// FIXME(1st Priority): Correct the dept fetching issue.
	if err := connections.DB.Where("visibility = ? AND dept IS NOT NULL AND dept != ''", true).
		Order("user_id ASC").
		Find(&profiles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch profiles."})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Profiles retrieved successfully", "profiles": publicProfiles(profiles), "requestTime": requestTime})
}

func getChangeLog(c *gin.Context) {
	var input changeLogRequest
	var requestTime = time.Now()
	// Request Validation
	if err := c.ShouldBindQuery(&input); err != nil {
		// Adding the request time format
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "requestTime": requestTime})
		return
	}

	// FIXME(prod): Only meant for dev, so we do not have much requests.
	// // If the server start time is after the last fetched time form the user, update the db completely
	// if input.LastUpdateTime.Before(serverStartTime) {
	// 	var profiles []model.Profile
	// 	if err := connections.DB.Find(&profiles, "visibility = ?", true).Error; err != nil {
	// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch profiles."})
	// 		return
	// 	}
	// 	c.JSON(http.StatusAccepted, gin.H{"message": "Completely updating local database due to server restart", "profiles": profiles, "requestTime": requestTime, "dropData": true})
	// 	return
	// }
	// Generate the json form the logs
	var addUserIDs []uuid.UUID // Refers to update in the change log
	var deleteUserIDs []uuid.UUID

	// Retrieve only un expired changelogs after last update time for user
	if err := connections.DB.Model(model.ChangeLog{}).
		Where("created_at > ? AND action = ?", input.LastUpdateTime, model.Update).
		Pluck("user_id", &addUserIDs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch 'add' updates if any."})
		return
	}
	if err := connections.DB.Model(model.ChangeLog{}).
		Where("created_at > ? AND action = ?", input.LastUpdateTime, model.Delete).
		Pluck("user_id", &deleteUserIDs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch 'delete' updates if any."})
		return
	}
	var newProfiles []model.Profile
	if err := connections.DB.Where("user_id IN ?", addUserIDs).Find(&newProfiles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve new profiles"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message":        "Updates fetched successfully.",
		"addProfiles":    publicProfiles(newProfiles),
		"deleteCacheIds": directorycache.IDs(deleteUserIDs),
		"requestTime":    requestTime,
	})
}

// publicProfile is the directory response contract. Keeping it separate from
// model.Profile prevents ORM metadata and future private columns from being
// exposed by the directory sync endpoints.
type publicProfile struct {
	UserID     uuid.UUID `json:"userId"`
	CacheID    string    `json:"cacheId"`
	Name       string    `json:"name"`
	Email      string    `json:"email"`
	RollNo     string    `json:"rollNo"`
	Dept       string    `json:"dept"`
	Course     string    `json:"course"`
	Gender     string    `json:"gender"`
	Hall       *string   `json:"hall"`
	RoomNumber *string   `json:"roomNo"`
	HomeTown   *string   `json:"homeTown"`
	Bapu       string    `json:"bapu"`
	Bachhas    string    `json:"bachhas"`
}

func publicProfiles(profiles []model.Profile) []publicProfile {
	response := make([]publicProfile, len(profiles))
	for i, profile := range profiles {
		response[i] = publicProfile{
			UserID:     profile.UserID,
			CacheID:    directorycache.ID(profile.UserID),
			Name:       profile.Name,
			Email:      profile.Email,
			RollNo:     profile.RollNo,
			Dept:       profile.Dept,
			Course:     profile.Course,
			Gender:     profile.Gender,
			Hall:       profile.Hall,
			RoomNumber: profile.RoomNumber,
			HomeTown:   profile.HomeTown,
			Bapu:       profile.Bapu,
			Bachhas:    profile.Bachhas,
		}
	}
	return response
}
