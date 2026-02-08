package workers

import (
	"compass/connections"
	"compass/model/puppylove"
	"encoding/json"
	"fmt"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// PuppyLoveWorker processes encrypted heart data and handles matching
func PuppyLoveWorker() error {
	logrus.Info("PuppyLove worker is up and running...")

	// Start consuming messages from puppylove queue
	msgs, err := connections.MQChannel.Consume(
		"puppylove", // queue name
		"",          // consumer tag
		false,       // autoAck
		false,       // exclusive
		false,       // noLocal
		false,       // noWait
		nil,         // args
	)
	if err != nil {
		return err
	}

	// Process messages in a goroutine
	for delivery := range msgs {
		var job PuppyLoveProfileAction
		// Try to decode the message body into a PuppyLoveProfileAction struct
		if err := json.Unmarshal(delivery.Body, &job); err != nil {
			logrus.Errorf("Failed to unmarshal puppylove job: %v", err)
			delivery.Nack(false, false) // don't requeue malformed messages
			continue
		}

		// Process the action
		if err := processPuppyLoveAction(job); err != nil {
			logrus.Errorf("Failed to process puppylove action for user %s: %v", job.RollNo, err)
			delivery.Nack(false, true) // Retry on error
			continue
		}

		// Acknowledge successful processing
		delivery.Ack(false)
	}

	return nil
}

// processPuppyLoveAction handles different PuppyLove actions
func processPuppyLoveAction(action PuppyLoveProfileAction) error {
	switch action.Action {
	case "verify_password":
		// User verified their password, profile already exists and is dirty
		logrus.Infof("User %s verified password", action.RollNo)
		return nil

	case "verify_password_and_create_keys":
		// User verified password, profile needs to be created
		logrus.Infof("User %s verified password and needs key creation", action.RollNo)
		return nil

	case "match_hearts":
		// Process heart matching
		return matchHearts(action.RollNo)

	default:
		logrus.Warnf("Unknown puppylove action: %s", action.Action)
		return nil
	}
}

// matchHearts finds matches for a user's hearts
// This is a secure matching algorithm that works with encrypted data
func matchHearts(rollNo string) error {
	// Get all hearts sent by this user
	var sentHearts []puppylove.SendHeart
	if err := connections.DB.Where("created_at >= ?", "now() - interval '7 days'").Find(&sentHearts).Error; err != nil {
		return fmt.Errorf("failed to fetch sent hearts: %w", err)
	}

	if len(sentHearts) == 0 {
		logrus.Infof("No hearts found for user %s", rollNo)
		return nil
	}

	// For each heart sent, check for matching return hearts
	for _, sentHeart := range sentHearts {
		// Find hearts that match the encrypted value
		var returnHearts []puppylove.ReturnHearts
		if err := connections.DB.
			Where("enc = ?", sentHeart.ENC).
			Find(&returnHearts).Error; err != nil {
			logrus.Errorf("Failed to find return hearts for user %s: %v", rollNo, err)
			continue
		}

		// Process matches
		for _, returnHeart := range returnHearts {
			if err := createMatch(sentHeart, returnHeart); err != nil {
				logrus.Errorf("Failed to create match: %v", err)
				continue
			}
		}
	}

	return nil
}

// createMatch creates a match entry when two hearts match
func createMatch(sentHeart puppylove.SendHeart, returnHeart puppylove.ReturnHearts) error {
	// Check if match already exists
	var existingMatch puppylove.MatchTable
	err := connections.DB.
		Where("(SONG12 = ? AND SONG21 = ?) OR (SONG12 = ? AND SONG21 = ?)",
			sentHeart.SONG_ENC, returnHeart.SONG_ENC,
			returnHeart.SONG_ENC, sentHeart.SONG_ENC).
		First(&existingMatch).Error

	if err == nil {
		// Match already exists
		logrus.Infof("Match already exists")
		return nil
	}

	if err != gorm.ErrRecordNotFound {
		return fmt.Errorf("database error: %w", err)
	}

	// Create new match
	match := puppylove.MatchTable{
		SONG12: sentHeart.SONG_ENC,
		SONG21: returnHeart.SONG_ENC,
	}

	if err := connections.DB.Create(&match).Error; err != nil {
		return fmt.Errorf("failed to create match: %w", err)
	}

	logrus.Infof("Match created with songs: %s <-> %s", sentHeart.SONG_ENC, returnHeart.SONG_ENC)
	return nil
}
