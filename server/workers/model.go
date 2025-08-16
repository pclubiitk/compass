package workers

import "github.com/google/uuid"

// MailJob defines the structure of a message pulled from RabbitMQ
type MailJob struct {
	Type string                 `json:"type"`
	To   string                 `json:"to"`
	Data map[string]interface{} `json:"data"` // dynamic fields based on mail type
}

// MailContent represents the final email content
type MailContent struct {
	To      string
	Subject string
	Body    string
	IsHTML  bool
}

type ModerationJob struct {
	AssetID uuid.UUID `json:"asset_id"`
	Type    string    `json:"type"`
}
