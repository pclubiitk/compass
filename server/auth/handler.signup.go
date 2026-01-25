package auth

import (
	"compass/connections"
	"compass/model"
	"compass/workers"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func signupHandler(c *gin.Context) {
	var input LoginSignupRequest

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}
	//Allow only IITK emails
	if !strings.HasSuffix(strings.ToLower(input.Email), "@iitk.ac.in") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Please use a valid IIT Kanpur email address"})
		return
	}

	// FOR DEV: BYPASS RECAPTCHA
	// ----------------------------------------------------------------------------- //
	// Throws error if captcha verification fails
	// registers the user in the DB only when the captcha is passed

	if viper.GetString("env") == "prod" {
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
	verificationTokenString := fmt.Sprintf("%s<>%s", token, expiry)
	
	var user model.User

	if err := connections.DB.Transaction(func(tx *gorm.DB) error {
        
        // Check for "cmhw_{rollno}"
        dummyEmail := fmt.Sprintf("cmhw_%s", input.RollNo)
        var existingUser model.User

        // We check if a user exists with the dummy email
        // We use Unscoped() in case the dummy user was soft-deleted, though likely not needed
        result := tx.Where("email = ?", dummyEmail).First(&existingUser)

        if result.Error == nil {
            // User Found (overwrite logic)
            // We update the EXISTING record's ID to the variable so we can use it later
            user = existingUser 

            user.Email = strings.ToLower(input.Email)
            user.Password = string(hashPass)
            user.VerificationToken = verificationTokenString
            user.IsVerified = false 
            
            if err := tx.Save(&user).Error; err != nil { return err }

            // Sync Profile email AND ensure RollNo is saved
            if err := tx.Model(&model.Profile{}).
                Where("user_id = ?", user.UserID).
                Updates(map[string]interface{}{
                    "email": user.Email,
                    "roll_no": input.RollNo,
					"visibility": false,
                }).Error; err != nil {
                return err
            }
		} else if errors.Is(result.Error, gorm.ErrRecordNotFound) {
            // User Not Found (new user logic)
			// does a profile with this Roll No already exist?
            // this happens if they already claimed the "cmhw_" account previously
            var duplicateCheck model.Profile
            if err := tx.Where("roll_no = ?", input.RollNo).First(&duplicateCheck).Error; err == nil {
                // We found a profile with this Roll No -> They are already registered.
                // We return a specific custom error text to catch it below.
                return fmt.Errorf("DUPLICATE_ROLL_NO")
            }
            
            user = model.User{
                Email:             strings.ToLower(input.Email),
                Password:          string(hashPass),
                IsVerified:        false,
                Role:              model.UserRole,
                VerificationToken: verificationTokenString,
                Profile:           model.Profile{
					Email:      strings.ToLower(input.Email), 
					Visibility: true,
					RollNo: 	input.RollNo,
                },
            }

            if err := tx.Create(&user).Error; err != nil { return err }
		} else { return result.Error }

		logEntry := model.ChangeLog{
			UserID: user.UserID,
			Action: "signup",
		}

		if err := tx.Create(&logEntry).Error; err != nil {
			return err
		}

		return nil
	}); err != nil {

		if err.Error() == "DUPLICATE_ROLL_NO" {
            c.JSON(http.StatusConflict, gin.H{"error": "An account with this Roll Number already exists"})
            return
        }

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
				return "http://localhost:3001"
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
