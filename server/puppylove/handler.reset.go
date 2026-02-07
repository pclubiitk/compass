package puppylove

import (
	"compass/connections"
	"compass/model"
	"compass/model/puppylove"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type PuppyLoveResetPasswordRequest struct {
	UserID   string `json:"id" binding:"required,uuid"`
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required,min=8"`
}

// ResetPuppyLovePasswordHandler resets the Compass password and clears all Puppy Love data
func ResetPuppyLovePasswordHandler(c *gin.Context) {
	var req PuppyLoveResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user model.User
	// Find user by ID
	if err := connections.DB.Where("user_id = ?", req.UserID).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User not found"})
		return
	}

	// Verify token format "token<>expiry"
	tokenSplit := strings.Split(user.VerificationToken, "<>")
	if len(tokenSplit) != 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid token format or no token pending"})
		return
	}

	// Verify expiry
	expiryTime, err := time.Parse(time.RFC3339, tokenSplit[1])
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid token time"})
		return
	}

	if time.Now().After(expiryTime) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reset token has expired"})
		return
	}

	// Verify token content
	if tokenSplit[0] != req.Token {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reset token"})
		return
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process password"})
		return
	}

	// Update Compass user password
	user.Password = string(hashedPassword)
	user.VerificationToken = "" // Clear token

	if err := connections.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	// Clear Puppy Love profile data
	var profile puppylove.PuppyLoveProfile
	if err := connections.DB.Where("user_id = ?", user.UserID).First(&profile).Error; err == nil {
		// Profile exists, reset it
		profile.Dirty = false          // Mark as unregistered
		profile.PubK = ""              // Clear public key
		profile.PrivK = ""             // Clear private key
		profile.Data = "{}"            // Clear data
		profile.Claims = ""            // Clear claims
		profile.Submit = false         // Reset submit status
		profile.Matches = []byte("[]") // Clear matches
		profile.Publish = false        // Unpublish profile
		profile.About = ""             // Clear about
		profile.Interests = ""         // Clear interests

		if err := connections.DB.Save(&profile).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear Puppy Love data"})
			return
		}
	}
	// If profile doesn't exist, that's fine - nothing to clear

	c.JSON(http.StatusOK, gin.H{
		"message": "Password updated and Puppy Love data cleared. You will need to re-register on Puppy Love.",
	})
}
