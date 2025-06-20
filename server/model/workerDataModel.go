package model

// Update the following models as required

type MailMessage struct {
	To           string            `json:"to"`
	Subject      string            `json:"subject"`
	Template     string            `json:"template"`
	TemplateData map[string]string `json:"template_data"`
}

type ModerationMessage struct {
	ReviewID string `json:"review_id"`
	UserID   string `json:"user_id"`
	Text     string `json:"text"`
}
