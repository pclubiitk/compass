package workers

// TODO: If the request fails, then it keeps on trying
// Use a logic of attempt and admin logs, max retry along with msg.Nack(false, true), msg.Reject(true) functions

import (
	"compass/connections"
	"encoding/json"
	"fmt"

	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
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
		// Format the email content
		content, err := FormatMail(job)
		if err != nil {
			logrus.Errorf("Failed to format mail: %v", err)
			delivery.Nack(false, true) // Retry formatting errors
			continue
		}
		// Send the email
		if err := SendMail(content); err != nil {
			logrus.Errorf("Failed to send email to %s: %v", content.To, err)
			delivery.Nack(false, true) // Retry send errors
			continue
		}
		logrus.Infof("Successfully sent email to %s [%s]", content.To, job.Type)
		delivery.Ack(false)
	}
	return fmt.Errorf("mail queue channel closed unexpectedly")
}
