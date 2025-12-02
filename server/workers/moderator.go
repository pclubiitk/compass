package workers

import (
	"compass/connections"
	"compass/model"
	"encoding/json"
	"fmt"
    "github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

// ModeratorWorker consumes moderation jobs and processes them
func ModeratorWorker() error {
	logrus.Info("Moderator worker is up and running...")

	msgs, err := connections.MQChannel.Consume(
		viper.GetString("rabbitmq.moderationqueue"),
		"",
		false, false, false, false, nil,
	)
	if err != nil {
		return err
	}

	for task := range msgs {
		var job ModerationJob
		if err := json.Unmarshal(task.Body, &job); err != nil {
			logrus.Errorf("Invalid moderation job format: %v", err)
			task.Nack(false, false)
			continue
		}

		flagged, err := moderateJob(job)
		if err != nil {
			logrus.Errorf("Moderation error for ID: %s, Type: %s, Error: %v", job.AssetID, job.Type, err)
			task.Nack(false, false)
			continue
		}

		task.Ack(false)

		// Fetch image and owner
		image, user, err := getImageAndUser(job.AssetID)
		if err != nil {
			logrus.Errorf("Failed to get image or user for ID: %s: %v", job.AssetID, err)
			task.Nack(false, false)
			continue
		}

		if flagged {
			if err := handleFlaggedImage(image, user); err != nil {
				logrus.Errorf("Failed to handle flagged image %s: %v", job.AssetID, err)
				task.Nack(false, false)
				continue
			}
		} else {
			if err := handleApprovedImage(job.AssetID, image, user); err != nil {
				logrus.Errorf("Failed to handle approved image %s: %v", job.AssetID, err)
				task.Nack(false, false)
				continue
			}
		}
	}

	return fmt.Errorf("moderation worker channel closed unexpectedly")
}

// moderateJob decides flagged/approved status based on type
func moderateJob(job ModerationJob) (bool, error) {
	switch job.Type {
	case model.ModerationTypeReviewText:
		return ModerateText(job.AssetID)
	case model.ModerationTypeImage:
		return ModerateImage(job.AssetID)
	default:
		logrus.Infof("Unknown moderation job type: %s", job.Type)
		return false, nil
	}
}

// getImageAndUser fetches image and its owner from DB
func getImageAndUser(assetID uuid.UUID) (model.Image, model.User, error) {
	imageID := assetID.String()
	var image model.Image
	if err := connections.DB.First(&image, "image_id = ?", imageID).Error; err != nil {
		return image, model.User{}, err
	}

	var user model.User
	if err := connections.DB.First(&user, "user_id = ?", image.OwnerID).Error; err != nil {
		return image, user, err
	}

	return image, user, nil
}

// handleFlaggedImage sends violation email and updates DB
func handleFlaggedImage(image model.Image, user model.User) error {
	imageID := image.ImageID.String()

	mailJob := MailJob{
		Type: "violation_warning",
		To:   user.Email,
		Data: map[string]interface{}{
			"username": user.Email,
			"reason":   "Your uploaded image violated our content policy and was rejected.",
		},
	}
	if err := sendEmail(mailJob); err != nil {
		logrus.Errorf("Failed to queue violation email for %s: %v", user.Email, err)
	}

	if err := connections.DB.Model(&model.Image{}).
		Where("image_id = ?", imageID).
		Update("status", model.Rejected).Error; err != nil {
		return err
	}

	return nil
}

// handleApprovedImage moves image, updates DB, and sends thank-you email
func handleApprovedImage(assetID uuid.UUID, image model.Image, user model.User) error {
	imageID := assetID.String()

	if err := MoveImageFromTmpToPublic(assetID); err != nil {
		logrus.Errorf("Failed to move image %s to public: %v", imageID, err)
	} else {
		logrus.Infof("Image %s successfully moved from tmp to public", imageID)
	}

	if err := connections.DB.Model(&model.Image{}).
		Where("image_id = ?", imageID).
		Update("status", model.Approved).Error; err != nil {
		return err
	}

	mailJob := MailJob{
		Type: "thanks_contribution",
		To:   user.Email,
		Data: map[string]interface{}{
			"username":      user.Email,
			"content_title": "Your uploaded image",
		},
	}
	if err := sendEmail(mailJob); err != nil {
		logrus.Errorf("Failed to queue thank-you email for %s: %v", user.Email, err)
	}

	return nil
}

// this method marshals the job and publishes to mail queue
func sendEmail(mailJob MailJob) error {
	payload, _ := json.Marshal(mailJob)
	return PublishJob(payload, "mail")
}
