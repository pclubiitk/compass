package workers

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

type ModerationJob struct {
	ReviewID  int    `json:"review_id"`
	ImagePath string `json:"image_path"` // server path like "uploads/review-123.png"
}

type ModerationResponse struct {
	ID      string `json:"id"`
	Model   string `json:"model"`
	Results []struct {
		Flagged    bool            `json:"flagged"`
		Categories map[string]bool `json:"categories"`
	} `json:"results"`
}

var openaiKey = os.Getenv("OPENAI_API_KEY")

// Connect to RabbitMQ and return channel + queue
func connectToQueue() (*amqp.Channel, <-chan amqp.Delivery, error) {
	url := fmt.Sprintf("amqp://%s:%s@%s:%d/",
		viper.GetString("rabbitmq.user"),
		viper.GetString("rabbitmq.password"),
		viper.GetString("rabbitmq.host"),
		viper.GetInt("rabbitmq.port"),
	)

	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, nil, fmt.Errorf("RabbitMQ connection failed: %w", err)
	}

	ch, err := conn.Channel()
	if err != nil {
		return nil, nil, fmt.Errorf("failed to open channel: %w", err)
	}

	qName := viper.GetString("rabbitmq.moderationqueue")
	msgs, err := ch.Consume(
		qName,
		"",
		true,  // auto-ack
		false, // not exclusive
		false,
		false,
		nil,
	)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to consume from queue: %w", err)
	}

	logrus.Infof("Connected to RabbitMQ queue: %s", qName)
	return ch, msgs, nil
}

func loadLocalImageAsBase64(path string) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	buf := new(bytes.Buffer)
	if _, err := io.Copy(buf, file); err != nil {
		return "", fmt.Errorf("failed to read image: %w", err)
	}

	return base64.StdEncoding.EncodeToString(buf.Bytes()), nil
}

// Call OpenAI Moderation API
func ModerateImage(base64Image string) (bool, error) {
	if openaiKey == "" {
		return false, fmt.Errorf("OPENAI_API_KEY not set")
	}

	reqBody, err := json.Marshal(map[string]string{
		"input": base64Image,
	})
	if err != nil {
		return false, fmt.Errorf("marshal error: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.openai.com/v1/moderations", bytes.NewBuffer(reqBody))
	if err != nil {
		return false, fmt.Errorf("request creation failed: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+openaiKey)
	req.Header.Set("Content-Type", "application/json")

	client := http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return false, fmt.Errorf("moderation API call failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var modResp ModerationResponse
	if err := json.Unmarshal(body, &modResp); err != nil {
		return false, fmt.Errorf("parsing response failed: %w", err)
	}

	if len(modResp.Results) == 0 {
		return false, fmt.Errorf("empty moderation result")
	}

	flagged := modResp.Results[0].Flagged
	if flagged {
		logrus.Warnf("Image flagged: %+v", modResp.Results[0].Categories)
	}
	return !flagged, nil
}

// MAIN WORKER FUNCTION
func ModeratorWorker() error {
	logrus.Info("Moderator worker is up and running...")

	ch, msgs, err := connectToQueue()
	if err != nil {
		return err
	}
	defer ch.Close()

	for msg := range msgs {
		var job ModerationJob
		if err := json.Unmarshal(msg.Body, &job); err != nil {
			logrus.Errorf("Invalid moderation job format: %v", err)
			continue
		}

		logrus.Infof("Received moderation job for ReviewID %d", job.ReviewID)

		base64Img, err := loadLocalImageAsBase64(job.ImagePath)
		if err != nil {
			logrus.Errorf("Image load failed for %s: %v", job.ImagePath, err)
			continue
		}

		safe, err := ModerateImage(base64Img)
		if err != nil {
			logrus.Errorf("Moderation error for ReviewID %d: %v", job.ReviewID, err)
			continue
		}

		if safe {
			logrus.Infof("ReviewID %d passed moderation", job.ReviewID)
			// Update DB: mark as approved (if applicable)
		} else {
			logrus.Warnf("ReviewID %d failed moderation. Consider deleting or flagging.", job.ReviewID)
			// Update DB: reject / delete image
			// os.Remove(job.ImagePath)
		}
	}

	return fmt.Errorf("queue channel closed unexpectedly")
}
