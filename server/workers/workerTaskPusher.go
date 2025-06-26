package workers

import (
	"compass/connections"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/spf13/viper"
)

func Publish(queueName string, message any) {
	// publish the message to the respective queue

	// do all possible error handling
}

func PublishMailJob(payload []byte) error {
	queue := viper.GetString("rabbitmq.mailqueue")
	return connections.MQChannel.Publish("", queue, false, false,
		amqp.Publishing{
			ContentType: "application/json",
			Body:        payload,
		})
}
