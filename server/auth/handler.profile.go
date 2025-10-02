package auth

import (
	"compass/connections"
	"compass/model"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func updatePassword(c *gin.Context) {
	var input UpdatePasswordRequest
	var user model.User
	var err error
	var newPasswordHash []byte

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

	if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.NewPassword)) != nil {
		if len(input.NewPassword) < 8 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 8 characters"})
			return
		}
		if newPasswordHash, err = bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable create new password"})
		}
	}
	if err := connections.DB.Model(&model.User{}).
		Where("user_id = ?", userID.(uuid.UUID)).
		Update("password", string(newPasswordHash)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed update password"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}

func updateProfile(c *gin.Context) {
	var input ProfileUpdateRequest

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
	profileData := model.Profile{
		// We set the UserID from the authenticated user's token, not from the input
		UserID:     userID.(uuid.UUID),
		Name:       input.Name,
		RollNo:     input.RollNo,
		Dept:       input.Dept,
		Course:     input.Course,
		Gender:     input.Gender,
		Hall:       input.Hall,
		RoomNumber: input.RoomNumber,
		HomeTown:   input.HomeTown,
	}

	// store updates in map
	// updates := make(map[string]interface{})
	// inputMap := structs.Map(input)
	// println(inputMap)

	//  TODO: Check if any change or not, and what is the structure of the input map

	// TODO: verification login request to CC

	// if len(updates) == 0 {
	// 	c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
	// 	return
	// }
	// Update into db
	if err := connections.DB.
		// Look for a profile with this user_id
		Where(model.Profile{UserID: userID.(uuid.UUID)}).
		// If found, update it with the new data. If not found, these values will be used for creation.
		Assign(profileData).
		// Executes the find, update, or create.
		FirstOrCreate(&model.Profile{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
	// TODO: set up for images, for image upload, if the similarity is > 90,can ignore it (can think)
}

func getProfileHandler(c *gin.Context) {
	// TODO: If i delete the user, userId do not exist but the token still exists hence the issue of null user.
	var user model.User
	userID, exist := c.Get("userID")
	if !exist {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	if err := connections.DB.
		Model(&model.User{}).
		Preload("Profile").
		Preload("ContributedLocations", connections.RecentFiveLocations).
		Preload("ContributedNotice", connections.RecentFiveNotices).
		Preload("ContributedReview", connections.RecentFiveReviews).
		Omit("password").
		Where("user_id = ?", userID.(uuid.UUID)).Omit("password").Find(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to fetch profile at the moment"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"profile": user})

}
