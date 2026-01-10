package auth

import (
	"compass/connections"
	"compass/model"
	"compass/workers"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"gorm.io/gorm"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"golang.org/x/crypto/bcrypt"
)

func isValidIITKEmail(email string) bool {
	return len(email) > 12 && email[len(email)-12:] == "@iitk.ac.in"
}


func signupHandler(c *gin.Context) {
	var input LoginSignupRequest

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}
	//Allow only IITK emails ie ends with @iitk.ac.in
	if !isValidIITKEmail(input.Email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Please use a valid IIT Kanpur email address"})
		return
	}
	



	// FOR DEV: BYPASS RECAPTCHA
	// ----------------------------------------------------------------------------- //
	// Throws error if captcha verification fails
	// registers the user in the DB only when the captcha is passed

	if (viper.GetString("env") == "prod"){
		if !verifyRecaptcha(input.Token) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Failed captcha verification"})
			return
		}
	}
	// ----------------------------------------------------------------------------- //

	// TODO: extract out the user model generation into a single transaction
	// Generate token and the user
	hashPass, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating user"})
		return
	}

	//  Generating verification token
	token := generateVerificationToken()
	expiry := time.Now().Add(time.Duration(viper.GetInt("expiry.emailVerification")) * time.Hour).Format(time.RFC3339)
	user := model.User{
		Email:             input.Email,
		Password:          string(hashPass),
		IsVerified:        false,
		Role:              model.UserRole,
		VerificationToken: fmt.Sprintf("%s<>%s", token, expiry),
		Profile:           model.Profile{Email: input.Email, Visibility: true},
	}

	// Saving user in DB and updating in changelog
	if err := connections.DB.Transaction(func(tx *gorm.DB) error {
		// Create the User (and Profile via nested struct)
		if err := tx.Create(&user).Error; err != nil {
			return err // This error bubbles up to the if err != nil check below
		}

		// Create the ChangeLog entry
		logEntry := model.ChangeLog{
			UserID: user.UserID,
			Action: "signup", 
		}

		if err := tx.Create(&logEntry).Error; err != nil {
			return err
		}

		return nil
	}); err != nil {
		// Handle Duplicate User Error (Postgres Code 23505)
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
			return
		}
		// Handle other DB errors
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating user"})
		return
	}

	//  Add mail job to queue
	verifyLink := fmt.Sprintf("%s/signup?token=%s&userID=%s",
		// Dev Mode, call the anonymous function
		func() string {
			if viper.GetString("domain") == "" {
				return "http://localhost:3000"
			}
			return fmt.Sprintf("https://%s.%s", "auth", viper.GetString("domain"))
		}(),
		token,
		user.UserID)

	job := workers.MailJob{
		Type: "user_verification",
		To:   input.Email,
		Data: map[string]interface{}{
			// To match the format in the UI, kB1-2Cd etc.
			"token": fmt.Sprintf("%s-%s", token[:3], token[3:]),
			"link":  verifyLink,
		},
	}
	payload, _ := json.Marshal(job)
	if err := workers.PublishJob(payload, model.MailQueue); err != nil {
		// Log but continue
		logrus.Error("Failed to enqueue mail job:", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Signup successful. Please check your email to verify.",
		"userID":  user.UserID,
	})
}
