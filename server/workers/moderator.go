package workers

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

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

//will have to create this env key, does not exist yet

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
		true,
		false,
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

// ModerateImage Call OpenAI Moderation API
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

func ModerateText(text string) (bool, error) {
	if os.Getenv("OPENAI_API_KEY") == "" {
		return false, fmt.Errorf("OPENAI_API_KEY not set")
	}

	type requestBody struct {
		Input string `json:"input"`
	}
	type moderationResponse struct {
		Results []struct {
			Flagged bool `json:"flagged"`
		} `json:"results"`
	}

	body, _ := json.Marshal(requestBody{Input: text})
	req, err := http.NewRequest("POST", "https://api.openai.com/v1/moderations", strings.NewReader(string(body)))
	if err != nil {
		return false, err
	}
	req.Header.Set("Authorization", "Bearer "+os.Getenv("OPENAI_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return false, err
	}

	var result moderationResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return false, err
	}

	if len(result.Results) > 0 && result.Results[0].Flagged {
		return true, nil
	}
	return false, nil
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
			// Update DB: Mark review as approved

		} else {
			logrus.Warnf("ReviewID %d failed moderation. Consider deleting or flagging.", job.ReviewID)
			// Update DB: Mark review as rejected/rejected by Bot
			// Remove Image from DB
		}
	}

	return fmt.Errorf("queue channel closed unexpectedly")
}
