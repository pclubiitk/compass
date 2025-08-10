package auth

import (
	"compass/connections"
	"compass/model"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func updateProfile(c *gin.Context) {
	var input ProfileUpdateRequest
	var user model.User
	var err error

	// TODO: Many functions have this repetition, extract out.
	// Request Validation
	userID, exist := c.Get("userID")
	if !exist {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}
	// find the current user, we are sure it exist
	connections.DB.Model(&model.User{}).Where("user_id = ?", userID.(uuid.UUID)).First(&user)
	// store updates in map
	updates := make(map[string]interface{})

	if input.NewPassword != nil && bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(*input.NewPassword)) != nil {
		if len(*input.NewPassword) < 8 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 8 characters"})
			return
		}
		if updates["password"], err = bcrypt.GenerateFromPassword([]byte(*input.NewPassword), bcrypt.DefaultCost); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to update password"})
		}
	}
	// Can add more fields here later

	// TODO: for image upload, if the similarity is > 90 (can think)
	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}
	// Update into db
	if err := connections.DB.Model(&model.User{}).
		Where("user_id = ?", userID.(uuid.UUID)).
		Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}

func getProfileHandler(c *gin.Context) {
	var user model.User
	userID, exist := c.Get("userID")
	if !exist {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	if err := connections.DB.
		Model(&model.User{}).
		Preload("ContributedLocations", connections.RecentFive).
		Preload("ContributedNotice", connections.RecentFive).
		Preload("ContributedReview", connections.RecentFive).
		Where("user_id = ?", userID.(uuid.UUID)).Omit("password").Find(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to fetch profile at the moment"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"profile": user})

}
