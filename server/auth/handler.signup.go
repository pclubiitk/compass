package auth

import (
	"compass/connections"
	"compass/model"
	"compass/workers"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func generateToken() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func signupHandler(c *gin.Context) {

	var db = connections.DB
	var input struct {
		Email string `json:"email" binding:"required,email"`
		Name  string `json:"username" binding:"required"`
	}
	//take the input, will have to change later perhaps

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Checking if user already exists
	var existing model.User
	db.Where("email = ?", input.Email).First(&existing)
	if existing.ID != 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		return
	}

	// Generate token and the user
	token, _ := generateToken()
	user := model.User{
		Email:             input.Email,
		Name:              input.Name,
		UserID:            strings.ReplaceAll(input.Email, "@", "_"),
		VerificationToken: token,
	}
	db.Create(&user)

	verifyLink := fmt.Sprintf("https://campus-compass.com/verify?token=%s", token)

	job := workers.MailJob{
		Type: "user_verification",
		To:   input.Email,
		Data: map[string]interface{}{
			"username": input.Name,
			"link":     verifyLink,
		},
	} //this struct is in Aditya's PR
	payload, _ := json.Marshal(job)
	err := workers.PublishMailJob(payload)
	if err != nil {
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Signup successful. Please check your email to verify."})

	// define the signup request model in the request model as per need

	// add the entry in the database

	// add a message to the mail queue for welcome mail and email verification

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation
}
