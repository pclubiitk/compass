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
			// TODO: Send mail
			// TODO: Update the tables accordingly
		} else {
			logrus.Infof("Moderation bot found it right\nID: %s\nType: %s", job.AssetID, job.Type)
		}
	}
	return fmt.Errorf("moderation worker channel closed unexpectedly")
}
