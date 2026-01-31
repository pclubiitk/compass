package workers

import (
	"fmt"
	"strings"
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

// isPermanentSMTPError checks if the error is a permanent SMTP error that
// should NOT be retried with a new connection. These include:
// - 5.4.5: Daily/hourly sending limit exceeded
// - 5.1.1: Invalid recipient address
// - 5.7.x: Authentication/policy errors
// Retrying these errors just wastes SMTP connections and login attempts.
func isPermanentSMTPError(err error) bool {
	if err == nil {
		return false
	}
	errStr := err.Error()
	// Gmail quota/rate limit errors
	if strings.Contains(errStr, "5.4.5") || // Daily sending limit
		strings.Contains(errStr, "5.4.4") || // Rate limit
		strings.Contains(errStr, "5.1.1") || // Invalid recipient
		strings.Contains(errStr, "5.7.") { // Auth/policy errors
		return true
	}
	return false
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
		// Check if this is a permanent error (quota, invalid recipient, etc.)
		// These errors won't be fixed by reconnecting, so don't waste connections
		if isPermanentSMTPError(err) {
			logrus.Errorf("Permanent SMTP error for %s (not retrying): %v", content.To, err)
			return fmt.Errorf("email send failed (permanent)")
		}

		// For transient errors (stale connection, timeout), try reconnecting once
		logrus.Warnf("Send failed (possibly stale connection), retrying: %v", err)
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
