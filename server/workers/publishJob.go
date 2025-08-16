package workers

import (
	"compass/connections"
	"fmt"

	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/spf13/viper"
)

func PublishJob(payload []byte, queueName string) error {
	queue := viper.GetString(fmt.Sprintf("rabbitmq.%squeue", queueName))
	return connections.MQChannel.Publish("", queue, false, false,
		amqp.Publishing{
			ContentType: "application/json",
			Body:        payload,
		})
}
