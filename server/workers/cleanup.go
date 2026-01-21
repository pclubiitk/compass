package workers

import (
	"compass/connections"
	"compass/model"
	"encoding/json"
	"time"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

func CleanupWorker() error {
	logrus.Info("Cleanup worker is up and running...")
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		if err := processUnverifiedUsers(); err != nil {
			logrus.Errorf("Error processing unverified users: %v", err)
		}
	}
	return nil
}

func processUnverifiedUsers() error {
	var users []model.User
	// Find users created more than 1 hours ago and not verified
	// We use Unscoped to find them even if they are already soft-deleted (though logic says they shouldn't be yet)
	// But actually, we want to find active users who are unverified.
	// TODO: Set the delete time into the config, 1hrs is good enough.
	threshold := time.Now().Add(-1 * time.Hour)

	// Exclude the users which are deleted via user itself
	result := connections.DB.
		Joins("LEFT JOIN profiles ON profiles.user_id = users.user_id").
		Preload("Profile").
		Where(`
        users.created_at < ?
        AND users.email NOT LIKE 'deleted_%'
        AND (
            users.is_verified = false
            OR profiles.name = ''
            OR profiles.name IS NULL
        )
    `, threshold).
		Find(&users)

	if result.Error != nil {
		return result.Error
	}

	if len(users) == 0 {
		logrus.Info("Found 0 users to delete")
		return nil
	}

	logrus.Infof("Found %d unverified users to cleanup", len(users))

	for _, user := range users {
		// Email
		name := user.Profile.Name
		if name == "" {
			name = user.Email
		}
		job := MailJob{
			Type: "account_deletion",
			To:   user.Email,
			Data: map[string]interface{}{
				"username": name,
			},
		}

		payload, err := json.Marshal(job)
		if err != nil {
			logrus.Errorf("Failed to marshal mail job for user %s: %v", user.UserID, err)
			continue
		}

		if err := PublishJob(payload, "mail"); err != nil {
			logrus.Errorf("Failed to publish mail job for user %s: %v", user.UserID, err)
			// We might want to continue to delete even if email fails, or retry.
			// For now, let's delete to ensure cleanup happens.
		}

		// TODO: (currently its too hard coded) better way for this delete user and related data in a transaction
		if err := connections.DB.Transaction(func(tx *gorm.DB) error {
			// 1. Delete associated images (bio pics)
			if err := tx.Unscoped().Where("parent_asset_id = ? AND parent_asset_type = ?", user.UserID, "users").Delete(&model.Image{}).Error; err != nil {
				return err
			}

			// 2. Delete any changelog entries for this user
			if err := tx.Unscoped().Where("user_id = ?", user.UserID).Delete(&model.ChangeLog{}).Error; err != nil {
				return err
			}

			// 3. Nullify any contributed locations/reviews/notices (unlikely for unverified users)
			if err := tx.Model(&model.Location{}).Where("contributed_by = ?", user.UserID).Update("contributed_by", nil).Error; err != nil {
				return err
			}
			if err := tx.Model(&model.Review{}).Where("contributed_by = ?", user.UserID).Update("contributed_by", nil).Error; err != nil {
				return err
			}
			if err := tx.Model(&model.Notice{}).Where("contributed_by = ?", user.UserID).Update("contributed_by", nil).Error; err != nil {
				return err
			}

			// 4. Delete the profile (due to foreign key constraint)
			if err := tx.Unscoped().Where("user_id = ?", user.UserID).Delete(&model.Profile{}).Error; err != nil {
				return err
			}

			// 5. Finally delete the user
			if err := tx.Unscoped().Delete(&user).Error; err != nil {
				return err
			}

			return nil
		}); err != nil {
			logrus.Errorf("Failed to delete user %s: %v", user.UserID, err)
		} else {
			logrus.Infof("Deleted unverified user: %s", user.Email)
		}
	}

	return nil
}
