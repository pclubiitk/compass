package workers

// add the static formate for the mails
import (
	"bytes"
	"fmt"
	"html/template"

	"github.com/spf13/viper"
)

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

// Dispatcher: decides which mail to generate based on job type
// job is a variable having the structure of MailJob, defined in the mail.go file
func FormatMail(job MailJob) (MailContent, error) {
	switch job.Type {
	case "user_verification":
		return formatVerificationEmail(job)
	case "thanks_contribution":
		return formatThanksEmail(job)
	case "violation_warning":
		return formatWarningEmail(job)
	case "publish_notice":
		return formatPublishNotice(job)
	case "generic_notice":
		return formatGenericNotice(job)
	default:
		return MailContent{}, fmt.Errorf("unknown mail type: %s", job.Type)
	}
}

// ========== Formatters ==========

func formatVerificationEmail(job MailJob) (MailContent, error) {
	username := job.Data["username"]
	link := job.Data["link"]
	data := map[string]interface{}{
		"Username": username,
		"Link":     link,
		"Expiry":   viper.GetInt("expiry.emailVerification"),
	}
	tmpl := `
		<h2>Hello {{.Username}},</h2>
		<p>Thank you for signing up! Please verify your email by clicking the link below:</p>
		<p><a href="{{.Link}}">Verify Email</a></p>
		<p>This link is valid for next {{.Expiry}} hours</p>
	`
	body, err := renderTemplate(tmpl, data)
	if err != nil {
		return MailContent{}, err
	}
	return MailContent{
		To:      job.To,
		Subject: "Verify Your Email",
		Body:    body,
		IsHTML:  true,
	}, nil
}

func formatThanksEmail(job MailJob) (MailContent, error) {
	username := job.Data["username"]
	contentTitle := job.Data["content_title"]
	data := map[string]interface{}{
		"Username":     username,
		"ContentTitle": contentTitle,
	}
	tmpl := `
		<h2>Hi {{.Username}},</h2>
		<p>Thank you for your contribution: <strong>{{.ContentTitle}}</strong>.</p>
		<p>We appreciate your involvement in the community!</p>
	`
	body, err := renderTemplate(tmpl, data)
	if err != nil {
		return MailContent{}, err
	}
	return MailContent{
		To:      job.To,
		Subject: "Thanks for your contribution!",
		Body:    body,
		IsHTML:  true,
	}, nil
}

func formatWarningEmail(job MailJob) (MailContent, error) {
	username := job.Data["username"]
	reason := job.Data["reason"]
	data := map[string]interface{}{
		"Username": username,
		"Reason":   reason,
	}
	tmpl := `
		<h2>Hello {{.Username}},</h2>
		<p>We've found that one of your recent submissions violated our community guidelines.</p>
		<p>Reason: {{.Reason}}</p>
		<p>Please make sure to follow the rules to avoid further action.</p>
	`
	body, err := renderTemplate(tmpl, data)
	if err != nil {
		return MailContent{}, err
	}
	return MailContent{
		To:      job.To,
		Subject: "Warning: Content Violation Detected",
		Body:    body,
		IsHTML:  true,
	}, nil
}

func formatPublishNotice(job MailJob) (MailContent, error) {
	username := job.Data["username"]
	title := job.Data["title"]
	data := map[string]interface{}{
		"Username": username,
		"Title":    title,
	}
	tmpl := `
		<h2>Hello {{.Username}},</h2>
		<p>Your content titled <strong>{{.Title}}</strong> has been successfully published!</p>
		<p>Thanks for being an active part of our community.</p>
	`
	body, err := renderTemplate(tmpl, data)
	if err != nil {
		return MailContent{}, err
	}
	return MailContent{
		To:      job.To,
		Subject: "Your content has been published!",
		Body:    body,
		IsHTML:  true,
	}, nil
}

func formatGenericNotice(job MailJob) (MailContent, error) {
	message := job.Data["message"]
	data := map[string]interface{}{
		"Message": message,
	}
	tmpl := `
		<h2>Notice</h2>
		<p>{{.Message}}</p>
	`
	body, err := renderTemplate(tmpl, data)
	if err != nil {
		return MailContent{}, err
	}
	return MailContent{
		To:      job.To,
		Subject: "Notification from Campus Compass",
		Body:    body,
		IsHTML:  true,
	}, nil
}

// ========== Template Helper ==========

func renderTemplate(tmpl string, data interface{}) (string, error) {
	t, err := template.New("email").Parse(tmpl)
	if err != nil {
		return "", err
	}
	var buf bytes.Buffer
	err = t.Execute(&buf, data)
	if err != nil {
		return "", err
	}
	return buf.String(), nil
}
