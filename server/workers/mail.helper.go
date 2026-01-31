package workers

import (
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"gopkg.in/mail.v2"
)

var (
	mailDialer *mail.Dialer
	mailSender mail.SendCloser
)

func InitMailDialer() {
	mailDialer = mail.NewDialer(
		viper.GetString("smtp.host"),
		viper.GetInt("smtp.port"),
		viper.GetString("smtp.user"),
		viper.GetString("smtp.pass"),
	)
	// Keep connection alive for reuse
	mailDialer.Timeout = 30 * time.Second
	logrus.Info("SMTP dialer initialized")
}

// returns reusable connection
func getMailSender() (mail.SendCloser, error) {
	if mailDialer == nil {
		InitMailDialer()
	}

	// create a connection in case we don't have an active one
	if mailSender == nil {
		var err error
		mailSender, err = mailDialer.Dial()
		if err != nil {
			return nil, fmt.Errorf("failed to connect to SMTP server: %w", err)
		}
		logrus.Debug("New SMTP connection established")
	}

	return mailSender, nil
}

// closes the connection
func resetMailSender() {
	if mailSender != nil {
		mailSender.Close()
		mailSender = nil
		logrus.Debug("SMTP connection reset")
	}
}

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

	// Get pooled connection
	sender, err := getMailSender()
	if err != nil {
		logrus.Errorf("Failed to get SMTP connection: %v", err)
		return err
	}

	// Send the message using the pooled connection
	if err := mail.Send(sender, m); err != nil {
		logrus.Warnf("Send failed (possibly stale connection), retrying: %v", err)
		// Reset connection and retry once
		resetMailSender()

		sender, err = getMailSender()
		if err != nil {
			logrus.Errorf("Failed to reconnect to SMTP server: %v", err)
			return err
		}

		if err := mail.Send(sender, m); err != nil {
			logrus.Errorf("Failed to send email to %s after retry: %v", content.To, err)
			resetMailSender()
			return fmt.Errorf("email send failed: %w", err)
		}
	}

	return nil
}
