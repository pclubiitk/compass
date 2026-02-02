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
	"github.com/sirupsen/logrus"
)

// restoreDummyAccount finds the soft-deleted placeholder and restores it.
// This ensures scraped data (Baccha/Bapu) is preserved for future signups.
func restoreDummyAccount(tx *gorm.DB, rollNo string) error {
	dummyEmail := fmt.Sprintf("cmhw_%s", rollNo)

	// 1. Restore the User (Set deleted_at = NULL)
	// We use Unscoped() to find it even though it is deleted.
	result := tx.Unscoped().
		Model(&model.User{}).
		Where("email = ?", dummyEmail).
		Update("deleted_at", nil) // gorm uses nil to represent NULL for time fields

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return nil // No dummy account existed, nothing to restore.
	}

	// 2. Find the user_id of the restored user
	var dummyUser model.User
	if err := tx.Where("email = ?", dummyEmail).First(&dummyUser).Error; err != nil {
		return err
	}

	// 3. Restore the Profile (Set deleted_at = NULL)
	if err := tx.Unscoped().
		Model(&model.Profile{}).
		Where("user_id = ?", dummyUser.UserID).
		Update("deleted_at", nil).Error; err != nil {
		return err
	}
	logrus.Infof("User dummy id %s", dummyUser.UserID)
	// Delete any pre-existing log for this user
	// (as it is syncing data based on change_logs table)
	if err := tx.Where("user_id = ?", dummyUser.UserID).Delete(&model.ChangeLog{}).Error; err != nil {
		return err
	}

	logEntry := model.ChangeLog{
        UserID: dummyUser.UserID,
        Action: "signup",
    }
	if err := tx.Create(&logEntry).Error; err != nil {
        return err
    }

	logrus.Infof("Restored backup dummy account for roll %s", rollNo)
	return nil
}

func deleteProfileData(c *gin.Context) {
	userID, _ := c.Get("userID")
	var existingProfile model.Profile
	if err := connections.DB.Where(model.Profile{UserID: userID.(uuid.UUID)}).First(&existingProfile).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User Profile not found"})
		return
	}

	// capture the Roll No before we delete/clear it
    userRollNo := existingProfile.RollNo

	if err := connections.DB.Transaction(func(tx *gorm.DB) error {
		// Update user email to a dummy email
		dummyEmail := fmt.Sprintf("deleted_%s@iitk.ac.in", existingProfile.UserID)
		if err := tx.Model(&model.User{}).Where("user_id = ?", existingProfile.UserID).Updates(map[string]interface{}{
			"email":       dummyEmail,
			"password":    "",
			"is_verified": false,
			// "profile_pic": "",
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

		// now that the Roll No is free, bring back the dummy account (if it exists)
        // so the scraped data is waiting for them if they ever return in future
        if err := restoreDummyAccount(tx, userRollNo); err != nil {
            // log the error but do not fail the deletion, as this is a background maintenance task
            logrus.Errorf("Failed to restore dummy backup for roll %s: %v", userRollNo, err)
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
