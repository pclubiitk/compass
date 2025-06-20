package workers

import (
	"time"

	"github.com/sirupsen/logrus"
)

func ModeratorWorker() error {
	logrus.Info("Moderator worker is up and running...")
	for {

		// consume the moderation reviews and process them with an external api

		// reject them if not valid, below some bound (configure them in the configure file)


		// for testing, simulate processing a request from a queue
		time.Sleep(5 * time.Second)
		logrus.Info("Processed a review content")
		// If something goes wrong:
		// return fmt.Errorf("RabbitMQ connection failed")
	}
}
