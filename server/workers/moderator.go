package workers

// TODO: If the request fails, then it keeps on trying
// Use a logic of attempt and admin logs, max retry along with msg.Nack(false, true), msg.Reject(true) functions

import (
	"compass/connections"
	"compass/model"
	"encoding/json"
	"fmt"

	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"compass/assets"
)

func ModeratorWorker() error {
	logrus.Info("Moderator worker is up and running...")
	// Start consuming messages
	msgs, err := connections.MQChannel.Consume(
		viper.GetString("rabbitmq.moderationqueue"), // queue
		"",    // consumer tag
		false, // autoAck
		false, // exclusive
		false, // noLocal
		false, // noWait
		nil,   // args
	)
	if err != nil {
		return err
	}
	// Continuously consume over the messages
	for task := range msgs {
		var job ModerationJob
		// Try to decode the message body into a ModerationJob struct
		if err := json.Unmarshal(task.Body, &job); err != nil {
			logrus.Errorf("Invalid moderation job format: %v", err)
			task.Nack(false, false) // don't requeue malformed messages
			continue
		}
		// switch according to type
		var (
			flagged bool
			err     error
		)
		// TODO: Revieve the description, why it was flagged using the response fields and add that into flagged
		switch job.Type {
		case model.ModerationTypeReviewText:
			flagged, err = ModerateText(job.AssetID)
		case model.ModerationTypeImage:
			flagged, err = ModerateImage(job.AssetID)
		default:
			logrus.Info("Received unknown type moderation job")
		}
		if err != nil {
			logrus.Errorf("Moderation error for\nID: %s\nType: %s\nError: %v", job.AssetID, job.Type, err)
			// TODO: Drop the messages if they are tried multiple times
			task.Nack(false, false) // don't requeue, improve on this logic later
			// task.Nack(false, true)
			continue
		} else {
			// Remove the task form queue, confirm that it is processed
			task.Ack(false)
		}
		if flagged {
			logrus.Infof("Moderation bot flagged\nID: %s\nType: %s", job.AssetID, job.Type)
      
			
     var image model.Image
    if err := connections.DB.First(&image, "image_id = ?", job.AssetID).Error; err != nil {
        logrus.Errorf("Failed to find image %s: %v", job.AssetID, err)
        task.Nack(false, false)
        continue
    }

    var user model.User
    if err := connections.DB.First(&user, "user_id = ?", image.OwnerID).Error; err != nil {
        logrus.Errorf("Failed to find owner for image %s: %v", job.AssetID, err)
        task.Nack(false, false)
        continue
    }

    // sending mail for violation of policy
    mailJob := MailJob{
        Type: "violation_warning",
        To:   user.Email,
        Data: map[string]interface{}{
            "username": user.Email, 
            "reason":   "Your uploaded image violated our content policy and was rejected.",
        },
    }
   	payload, _ := json.Marshal(mailJob)
			if err := PublishJob(payload, "mail"); err != nil {
				logrus.Errorf("Failed to queue violation email for %s: %v", mailJob.To, err)
			}		
			// TODO: Send mail
			// TODO: Update the tables accordingly
            // Updating DB status : Rejected

    if err := connections.DB.Model(&model.Image{}).
        Where("image_id = ?", job.AssetID).
        Update("status", model.Rejected).Error; err != nil {
        logrus.Errorf("Failed to update image status for %s: %v", job.AssetID, err)
        task.Nack(false, false)
        continue
    }
		} else {
			logrus.Infof("Moderation bot found it right\nID: %s\nType: %s", job.AssetID, job.Type)

	if err := assets.MoveImageFromTmpToPublic(job.AssetID); err != nil {    //moving img to public if approved
        logrus.Errorf("Failed to move image %s to public: %v", job.AssetID, err)
    } else {
        logrus.Infof("Image %s successfully moved from tmp to public", job.AssetID)
    }
			// Updating DB status to Approved
			 if err := connections.DB.Model(&model.Image{}).
		Where("image_id = ?", job.AssetID).
		Update("status", model.Approved).Error; err != nil {
		logrus.Errorf("Failed to update image status for %s: %v", job.AssetID, err)
		continue
	}

	// Sending thank-you email 
	var image model.Image
	if err := connections.DB.First(&image, "image_id = ?", job.AssetID).Error; err != nil {
		logrus.Errorf("Failed to find image %s: %v", job.AssetID, err)
		task.Nack(false, false)
		continue
	}

	var user model.User
	if err := connections.DB.First(&user, "user_id = ?", image.OwnerID).Error; err != nil {
		logrus.Errorf("Failed to find owner for image %s: %v", job.AssetID, err)
		task.Nack(false, false)
		continue
	}

	mailJob := MailJob{
		Type: "thanks_contribution",
		To:   user.Email,
		Data: map[string]interface{}{
			"username":      user.Email,
			"content_title": "Your uploaded image",
		},
	}
	payload, _ := json.Marshal(mailJob)
	if err := PublishJob(payload, "mail"); err != nil {
		logrus.Errorf("Failed to queue thank-you email for %s: %v", mailJob.To, err)
	}
}
	}
	return fmt.Errorf("moderation worker channel closed unexpectedly")
}
