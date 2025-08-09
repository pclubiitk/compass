package workers


// TODO: If the request fails, then it keeps on trying

import (
	"compass/connections"
	"encoding/json"
	"fmt"

	// amqp "github.com/rabbitmq/amqp091-go"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"gopkg.in/mail.v2"
	// "time"
)

func SendMail(content MailContent) error {
	// Create a new email message
	m := mail.NewMessage()
	m.SetHeader("From", viper.GetString("smtp.user"))
	m.SetHeader("To", content.To)
	m.SetHeader("Subject", content.Subject)

	if content.IsHTML {
		m.SetBody("text/html", content.Body)
	} else {
		m.SetBody("text/plain", content.Body)
	}

	// Set up SMTP dialer using values from config
	d := mail.NewDialer(
		viper.GetString("smtp.host"),
		viper.GetInt("smtp.port"),
		viper.GetString("smtp.user"),
		viper.GetString("smtp.pass"),
	)

	// Send the message
	if err := d.DialAndSend(m); err != nil {
		logrus.Errorf("Failed to send email to %s: %v", content.To, err)
		return fmt.Errorf("email send failed: %w", err)
	}
	return nil
}

func MailingWorker() error {
	logrus.Info("Mailing worker is up and running...")

	// Get queue name from config
	mailQueue := viper.GetString("rabbitmq.mailqueue")

	// Start consuming messages
	msgs, err := connections.MQChannel.Consume(
		mailQueue, // queue
		"",        // consumer tag
		false,     // autoAck
		false,     // exclusive
		false,     // noLocal
		false,     // noWait
		nil,       // args
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
			delivery.Nack(false, true) // retry formatting errors
			continue
		}
		// Send the email
		if err := SendMail(content); err != nil {
			logrus.Errorf("Failed to send email to %s: %v", content.To, err)
			delivery.Nack(false, true) // retry send errors
			continue
		}
		logrus.Infof("Successfully sent email to %s [%s]", content.To, job.Type)
		delivery.Ack(false)
	}
	return fmt.Errorf("mail queue channel closed unexpectedly")

	/*for {
	// Connect to the mail queue in the message broker

		// working dir setup

		// Process the mails

		// define the required formate in the format.mail.go
		//  1. For user verification
		//  2. Thanking message for contribution
		//  3. Warning message if violating content is submitted by user
		//  4. Notice publish verification message
		//	5. Any other message if you feel its relevant

		// for testing, simulate processing mail from a queue
		time.Sleep(5 * time.Second)
		logrus.Info("Processed a mail task")
	}*/
}
