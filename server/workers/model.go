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

// PuppyLoveProfileAction defines actions for PuppyLove profile creation/access
type PuppyLoveProfileAction struct {
	Action     string    `json:"action"`       // "verify_password" or "verify_password_and_create_keys"
	UserID     uuid.UUID `json:"user_id"`
	RollNo     string    `json:"roll_no"`
	HasProfile bool      `json:"has_profile"`
	IsDirty    bool      `json:"is_dirty"`    // User registration status
	Timestamp  int64     `json:"timestamp"`
}
