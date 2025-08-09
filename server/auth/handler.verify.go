package auth

import (
	"compass/connections"
	"compass/model"
	"crypto/rand"
	"encoding/hex"
	"net/http"

	"github.com/gin-gonic/gin"
)

func generateVerificationToken() (string) {
	b := make([]byte, 32)
	rand.Read(b) // never returns an error and fills b completely
	return hex.EncodeToString(b)
}

func verificationHandler(c *gin.Context) {
	var db = connections.DB

	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token missing"})
		return
	}

	var user model.User
	if err := db.Where("verification_token = ?", token).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired token"})
		return
	}

	user.IsVerified = true
	user.VerificationToken = ""
	db.Save(&user)

	c.Redirect(http.StatusSeeOther, "https://campus-compass.com/verified")
}
