package workers

import (
	"fmt"

	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"gopkg.in/mail.v2"
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
