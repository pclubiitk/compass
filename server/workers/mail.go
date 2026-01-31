package workers

import (
	"compass/connections"
	"encoding/json"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

const (
	maxRetries    = 1
	baseBackoff   = 10 * time.Second
	retryCountKey = "x-retry-count"
)

func MailingWorker() error {
	logrus.Info("Mailing worker is up and running...")

	// Start consuming messages
	msgs, err := connections.MQChannel.Consume(
		viper.GetString("rabbitmq.mailqueue"), // queue
		"",                                    // consumer tag
		false,                                 // autoAck
		false,                                 // exclusive
		false,                                 // noLocal
		false,                                 // noWait
		nil,                                   // args
	)
	if err != nil {
		return err
	}
	// Process messages in a goroutine
	for delivery := range msgs {
		var job MailJob
		// Try to decode the message body into a MailJob struct
		if err := json.Unmarshal(delivery.Body, &job); err != nil {
			logrus.Errorf("Failed to unmarshal mail job: %v", err)
			delivery.Nack(false, false) // don't requeue malformed messages
			continue
		}

		// Get retry count from headers
		retryCount := 0
		if delivery.Headers != nil {
			if count, ok := delivery.Headers[retryCountKey].(int32); ok {
				retryCount = int(count)
			}
		}

		// Format the email content
		content, err := FormatMail(job)
		if err != nil {
			logrus.Errorf("Failed to format mail: %v", err)
			// Format errors are likely permanent, don't retry
			delivery.Nack(false, false)
			continue
		}

		// Send the email
		if err := SendMail(content); err != nil {
			logrus.Errorf("Failed to send email to %s (attempt %d/%d): %v", content.To, retryCount+1, maxRetries, err)

			if retryCount >= maxRetries-1 {
				logrus.Errorf("Max retries reached for email to %s, discarding", content.To)
				delivery.Nack(false, false) // Don't requeue after max retries
				continue
			}
			logrus.Infof("Will retry email to %s with retry count %d", content.To, retryCount)

			delivery.Nack(false, true) // Requeue with backoff
			continue
		}
		logrus.Infof("Successfully sent email to %s [%s]", content.To, job.Type)
		delivery.Ack(false)
	}
	return fmt.Errorf("mail queue channel closed unexpectedly")
}
