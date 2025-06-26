package workers

import (
	"github.com/sirupsen/logrus"
	"time"
)

func MailingWorker() error {
	logrus.Info("Mailing worker is up and running...")
	for {
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
	}
}
