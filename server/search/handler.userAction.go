package search

import (
	"compass/connections"
	"compass/model"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func deleteProfileData(c *gin.Context) {
	userID, _ := c.Get("userID")
	var existingProfile model.Profile
	if err := connections.DB.Where(model.Profile{UserID: userID.(uuid.UUID)}).First(&existingProfile).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User Profile not found"})
		return
	}
	if err := connections.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Delete(&model.Profile{}, "user_id = ?", existingProfile.UserID).Error; err != nil {
			return err
		}
		// Delete any pre existing log for user
		if err := tx.Where("user_id = ?", existingProfile.UserID).Delete(&model.ChangeLog{}).Error; err != nil {
			return err
		}
		if err := tx.Create(&model.ChangeLog{UserID: existingProfile.UserID, Action: model.Delete}).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to delete profile"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User profile data deleted successfully"})
}

func toggleVisibility(c *gin.Context) {
	userID, _ := c.Get("userID")
	var input toggleVisibilityRequest
	// Request Validation
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}
	if err := connections.DB.Transaction(func(tx *gorm.DB) error {
		updateAction := model.Delete
		if *input.Visibility {
			updateAction = model.Add
		}

		// Update the profile
		var userProfile model.Profile
		result := tx.Model(&userProfile).
			// Return its values
			Clauses(clause.Returning{}).
			Where("user_id = ?", userID).
			Update("visibility", *input.Visibility)

		if result.Error != nil {
			return result.Error
		}

		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}

		// Delete any pre existing log for user
		if err := tx.Where("user_id = ?", userProfile.UserID).Delete(&model.ChangeLog{}).Error; err != nil {
			return err
		}

		// Create the new log entry
		logEntry := model.ChangeLog{
			UserID: userProfile.UserID,
			Action: updateAction,
		}
		if err := tx.Create(&logEntry).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User profile not found."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to update visibility at the moment."})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "visibility updated successfully"})

}
