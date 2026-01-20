package search

import (
	"compass/connections"
	"compass/middleware"
	"compass/model"
	"fmt"
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
		// Update user email to a dummy email
		dummyEmail := fmt.Sprintf("deleted_%s@iitk.ac.in", existingProfile.UserID)
		if err := tx.Model(&model.User{}).Where("user_id = ?", existingProfile.UserID).Updates(map[string]interface{}{
			"email":       dummyEmail,
			"password":    "",
			"is_verified": false,
			"profile_pic": "",
		}).Error; err != nil {
			return err
		}

		// Clear profile data but keep name, email and set to their zero value
		if err := tx.Model(&model.Profile{}).
			Where("user_id = ?", existingProfile.UserID).
			Select("RollNo", "Dept", "Course", "Gender", "Hall", "RoomNumber", "HomeTown", "Visibility", "Bapu", "Bachhas").
			Updates(model.Profile{}).Error; err != nil {
			return err
		}

		// TODO: Delete bio pics
		if err := tx.Where("parent_asset_id = ? AND parent_asset_type = ?", existingProfile.UserID, "users").Delete(&model.Image{}).Error; err != nil {
			return err
		}

		// Delete any pre existing log for user
		if err := tx.Where("user_id = ?", existingProfile.UserID).Delete(&model.ChangeLog{}).Error; err != nil {
			return err
		}

		// Create log entry
		if err := tx.Create(&model.ChangeLog{UserID: existingProfile.UserID, Action: model.Delete}).Error; err != nil {
			return err
		}

		return nil
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to delete profile"})
		return
	}
	middleware.ClearAuthCookie(c)
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
			updateAction = model.Update
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

	// TODO: We can extract out this token refresh logic
	// Clear the old cookie with visibility true
	middleware.ClearAuthCookie(c)
	token, err := middleware.GenerateAccessToken(userID.(uuid.UUID))
	ref_token, _ := middleware.GenerateRefreshToken(userID.(uuid.UUID))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "visibility updated successfully, please login again to continue"})
	}
	middleware.SetAuthCookie(c, token)
	middleware.SetRefreshCookie(c, ref_token)

	c.JSON(http.StatusOK, gin.H{"message": "visibility updated successfully"})

}
