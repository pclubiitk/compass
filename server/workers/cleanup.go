package workers

import (
	"compass/connections"
	"compass/model"
	"encoding/json"
	"time"

	"github.com/sirupsen/logrus"
)

func CleanupWorker() error {
	logrus.Info("Cleanup worker is up and running...")
	ticker := time.NewTicker(12 * time.Hour)
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
	// Find users created more than 24 hours ago and not verified
	// We use Unscoped to find them even if they are already soft-deleted (though logic says they shouldn't be yet)
	// But actually, we want to find active users who are unverified.
	// TODO: Set the delete time into the config, 6hrs is good enough.
	threshold := time.Now().Add(-24 * time.Hour)

	result := connections.DB.Preload("Profile").Where("is_verified = ? AND created_at < ?", false, threshold).Find(&users)
	if result.Error != nil {
		return result.Error
	}

	if len(users) == 0 {
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
		// TODO: test this worker + ensure the profile is also deleted if created.
		// Delete User
		// Unscoped().Delete() is used to perform a HARD DELETE.
		if err := connections.DB.Unscoped().Delete(&user).Error; err != nil {
			logrus.Errorf("Failed to delete user %s: %v", user.UserID, err)
		} else {
			logrus.Infof("Deleted unverified user: %s", user.Email)
		}
	}

	return nil
}
