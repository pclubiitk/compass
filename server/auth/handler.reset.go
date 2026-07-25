package auth

import (
	"compass/connections"
	"compass/model"
	plmodel "compass/model/puppylove"
	ppy "compass/puppylove"
	"compass/workers"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"golang.org/x/crypto/bcrypt"
)

func forgotPasswordHandler(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// FOR DEV: BYPASS RE-CAPTCHA
	// ----------------------------------------------------------------------------- //
	if viper.GetString("env") == "prod" {
		if !verifyRecaptcha(req.Token) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Failed captcha verification"})
			return
		}
	}
	// ----------------------------------------------------------------------------- //
	var user model.User
	if err := connections.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		// Do not reveal if email exists or not for security
		c.JSON(http.StatusOK, gin.H{"message": "If this email is registered, you will receive a reset link."})
		return
	}

	if !user.IsVerified {
		// Still return success message to prevent user enumeration
		c.JSON(http.StatusOK, gin.H{"message": "If this email is registered, you will receive a reset link."})
		return
	}

	if user.VerificationToken != "" {
		// Check if existing token is still valid and was issued recently (rate limiting)
		tokenSplit := strings.Split(user.VerificationToken, "<>")
		if len(tokenSplit) == 2 {
			if expiryTime, err := time.Parse(time.RFC3339, tokenSplit[1]); err == nil {
				// Token expiry is set to 15 min after creation, so creation time = expiry - 15 min
				createdAt := expiryTime.Add(-15 * time.Minute)
				if time.Since(createdAt) < 1*time.Hour {
					c.JSON(http.StatusTooManyRequests, gin.H{"error": "A reset link was already sent recently. Please try again later."})
					return
				}
			}
		}
	}

	// Generate reset token
	token := uuid.New().String()
	expiry := time.Now().Add(15 * time.Minute)

	// Format: token<>expiryTime
	user.VerificationToken = fmt.Sprintf("%s<>%s", token, expiry.Format(time.RFC3339))

	if err := connections.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process request"})
		return
	}

	// Send email
	// Replaced with actual frontend URL from env or similar, for now hardcoded matches previous logic
	// Added id query param for identification
	resetLink := fmt.Sprintf("%s/reset-password?token=%s&id=%s", viper.GetString("frontend_url"), token, user.UserID.String())

	job := workers.MailJob{
		Type: "password_reset",
		To:   user.Email,
		Data: map[string]interface{}{
			"token": token,
			"link":  resetLink,
		},
	}

	payload, _ := json.Marshal(job)
	if err := workers.PublishJob(payload, model.MailQueue); err != nil {
		// Log but continue
		logrus.Error("Failed to enqueue mail job:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send reset email"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "If this email is registered, you will receive a reset link."})
}

func resetPasswordHandler(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user model.User
	// Find user by ID
	if err := connections.DB.Model(model.User{}).Preload("Profile").Where("user_id = ?", req.UserID).First(&user).Error; err != nil {
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

	// Update user
	user.Password = string(hashedPassword)
	user.VerificationToken = "" // Clear token
	// user.IsVerified = true      // Auto-verify user on password reset success -> REMOVED FOR SECURITY

	if err := connections.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}
	if ppy.IsPuppyLoveEnabled() {
		// Clear Puppy Love profile data if it exists (ALWAYS clear on password reset, not just if dirty)
		// FIXME: earlier here we were creating a new context for delete, we can create a global context which is used everywhere ( context.Background() was used), currently it to the request's context.
		ctx := c.Request.Context()

		if err := connections.DB.WithContext(ctx).
			Where("user_id = ? OR roll_no = ?", user.UserID, user.Profile.RollNo).
			Delete(&plmodel.PuppyLoveProfile{}).Error; err != nil {
			logrus.Error("Failed to clear Puppy Love profile:", err)
			c.JSON(http.StatusAccepted, gin.H{"message": "Password updated successfully. Failed to clear Puppy Love profile; please contact support."})
			return
		}

		// Remove the public key from Redis so it cannot be reused
		if err := connections.RedisClient.HDel(connections.RedisCtx, "puppylove:public_keys", user.Profile.RollNo).Err(); err != nil {
			logrus.Error("Failed to remove Puppy Love public key from redis:", err)
			// do not fail the password reset for Redis errors
		}

		// Successfully deleted profile
		c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully. If you had a Puppy Love profile, it has been cleared. You will need to re-register."})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully."})
}
