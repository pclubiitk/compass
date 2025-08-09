package auth

import (
	"compass/connections"
	"compass/model"
	"compass/workers"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/spf13/viper"
	"golang.org/x/crypto/bcrypt"
)

func signupHandler(c *gin.Context) {
	var input SignUpRequest
	// Request Validation
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}
	// Generate token and the user
	token := generateVerificationToken()
	if hashPass, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating user"})
	} else {
		user := model.User{
			Email:             input.Email,
			Password:          string(hashPass),
			Name:              input.Name,
			IsVerified:        false,
			Role:              "user",
			VerificationToken: token,
		}
		if err := connections.DB.Create(&user).Error; err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				// Unique violation
				c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating user"})
		}
	}
	// Add job to mail queue
	verifyLink := fmt.Sprintf("http://%s/verify?token=%s", viper.GetString("domain"), token)
	job := workers.MailJob{
		Type: "user_verification",
		To:   input.Email,
		Data: map[string]interface{}{
			"username": input.Name,
			"link":     verifyLink,
		},
	}
	payload, _ := json.Marshal(job)
	err := workers.PublishMailJob(payload)
	if err != nil {
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Signup successful. Please check your email to verify."})
}
