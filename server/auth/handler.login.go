package auth

import (
	"compass/connections"
	"compass/middleware"
	"compass/model"
	"encoding/json"
	"net/http"
	"os"
	"bytes"
	"io"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)



// Struct for reCAPTCHA response

func loginHandler(c *gin.Context) {
	var req LoginRequest
	var dbUser model.User

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	//  Verify reCAPTCHA v3 token
	if !verifyRecaptcha(req.Token) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Failed captcha verification"})
		return
	}

	//  Fetch user from DB
	result := connections.DB.Model(&model.User{}).Select("email", "user_id", "password", "role", "is_verified").
		Where("email = ?", req.Email).First(&dbUser)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	//  Checking password
	if err := bcrypt.CompareHashAndPassword([]byte(dbUser.Password), []byte(req.Password)); err != nil {
		middleware.ClearAuthCookie(c)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Creating JWT token
	token, err := middleware.GenerateToken(dbUser.UserID, int(dbUser.Role), dbUser.IsVerified)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	
	middleware.ClearAuthCookie(c)
	middleware.SetAuthCookie(c, token)

	c.JSON(http.StatusOK, gin.H{"message": "Login successful"})
}

// verifyRecaptcha calls Google API to validate token .
func verifyRecaptcha(token string) bool {
	secret := os.Getenv("RECAPTCHA_SECRET_KEY")
	url := "https://www.google.com/recaptcha/api/siteverify"
	
	data := []byte("secret=" + secret + "&response=" + token)
	resp, err := http.Post(url, "application/x-www-form-urlencoded", bytes.NewBuffer(data))
	if err != nil {
		return false
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var recaptchaResp RecaptchaResponse
	if err := json.Unmarshal(body, &recaptchaResp); err != nil {
		return false
	}

	// Only accept if successful and score >= 0.5
	if recaptchaResp.Success && recaptchaResp.Score >= 0.5 {
		return true
	}
	return false
}
