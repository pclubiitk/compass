// File for connecting the application to the rabbitmq message broker
// you may access the channel anywhere in the application using connections.MQChannel
package connections

import (
	"log"

	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

var MQConn *amqp.Connection
var MQChannel *amqp.Channel

func initRabbitMQ() {
	var err error
	url := "amqp://" + viper.GetString("rabbitmq.user") + ":" + viper.GetString("rabbitmq.password")
	url += "@" + viper.GetString("rabbitmq.host") + ":" + viper.GetString("rabbitmq.port") + "/"

	MQConn, err = amqp.Dial(url)
	if err != nil {
		log.Fatalf("Failed to connect to RabbitMQ: %v", err)
	}

	MQChannel, err = MQConn.Channel()
	if err != nil {
		log.Fatalf("Failed to open a channel: %v", err)
	}

	// Declare Mail Queue
	mailQueue := viper.GetString("rabbitmq.mailqueue")
	_, err = MQChannel.QueueDeclare(
		mailQueue,
		true,  // durable
		false, // autoDelete
		false, // exclusive
		false, // noWait
		nil,   // arguments
	)
	if err != nil {
		log.Fatalf("Failed to declare mail queue: %v", err)
	}

	// Declare Moderation Queue
	moderationQueue := viper.GetString("rabbitmq.moderationqueue")
	_, err = MQChannel.QueueDeclare(
		moderationQueue,
		true,  // durable
		false, // autoDelete
		false, // exclusive
		false, // noWait
		nil,   // arguments
	)
	if err != nil {
		log.Fatalf("Failed to declare moderation queue: %v", err)
	}
	logrus.Info("Set up done for rabbitmq...")

}
