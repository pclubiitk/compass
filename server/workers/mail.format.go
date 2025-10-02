package workers

// add the static formate for the mails
import (
	"bytes"
	"fmt"
	"html/template"

	"github.com/spf13/viper"
)

// ========== Use cases ==========

//  1. For user verification
//  2. Thanking message for contribution
//  3. Warning message if violating content is submitted by user
//  4. Notice publish verification message
//	5. Any other message if you feel its relevant

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
	// username := job.Data["username"]
	token := job.Data["token"]
	link := job.Data["link"]
	data := map[string]interface{}{
		// "Username": username,
		"Token":  	token,
		"Link":     link,
		"Expiry":   viper.GetInt("expiry.emailVerification"),
	}
	// <h2>Hello {{.Username}},</h2>
	tmpl := `
		<h2>Thank you for signing up!</h2> 
		<p>Bellow is your otp for verification:</p>
		<h2>{{.Token}}</h2>
		<p>or</p>
		<p>you may directly verify your email by clicking the link below:</p>
		<p><a href="{{.Link}}">Verify Email</a></p>
		<p>This link is valid for next {{.Expiry}} hours</p>
		<p>If this action was not taken by you, please ignore this mail, and do not share this opt with anyone</p>
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
