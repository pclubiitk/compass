package auth

import (
	"compass/connections"
	"compass/middleware"
	"compass/model"
	"crypto/rand"
	"fmt"
	"math/big"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func generateVerificationToken() string {
	// Generate a number between 0 and 999999
	n, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err != nil {
		return ""
	}
	return fmt.Sprintf("%06d", n.Int64()) // always 6 digits
}

func verificationHandler(c *gin.Context) {
	var db = connections.DB
	token := c.Query("token")
	userID, err := uuid.Parse(c.Query("userID"))
	if token == "" || err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Request"})
		return
	}

	// Check rate limit before doing anything else
	rateLimitKey := fmt.Sprintf("rate_limit:email_verification:%s", userID)
	currentAttempts, redisErr := connections.RedisClient.Get(connections.RedisCtx, rateLimitKey).Int64()
	if redisErr == nil && currentAttempts >= int64(verificationMaxAttempts) {
		ttl, _ := connections.RedisClient.TTL(connections.RedisCtx, rateLimitKey).Result()
		if ttl > 0 {
			c.Header("Retry-After", fmt.Sprintf("%d", int(ttl.Seconds())+1))
		}

		durationMinutes := int(verificationWindow.Minutes())
		waitMessage := fmt.Sprintf("Too many incorrect attempts. Please wait %d minute", durationMinutes)
		if durationMinutes != 1 {
			waitMessage += "s"
		}

		c.JSON(http.StatusTooManyRequests, gin.H{"error": waitMessage})
		return
	}

	var user model.User
	if err := db.Where("user_id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User not found"})
		return
	}
	tokenSplit := strings.Split(user.VerificationToken, "<>")
	if len(tokenSplit) != 2 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token not generated properly"})
		return
	}
	// TODO: better way to fix the formate for time.Parse
	expiryTime, err := time.Parse(time.RFC3339, tokenSplit[1])
	fmt.Println(tokenSplit[1], time.Now())
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token time"})
		return
	}
	if time.Now().After(expiryTime) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token expired"})
		return
	}
	if tokenSplit[0] != token {
		// Wrong OTP — increment counter and reset the 15-min window on each wrong attempt
		attempts, incrErr := connections.RedisClient.Incr(connections.RedisCtx, rateLimitKey).Result()
		if incrErr != nil {
			// Fail closed: if Redis is unavailable we cannot enforce rate limiting,
			// so reject the request entirely rather than silently allowing bypass.
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Service temporarily unavailable. Please try again later."})
			return
		}

		// Always reset expiry so the window is 15 min from the last wrong attempt
		connections.RedisClient.Expire(connections.RedisCtx, rateLimitKey, verificationWindow)
		remaining := int64(verificationMaxAttempts) - attempts
		if remaining > 0 {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":             "Invalid OTP",
				"attemptsRemaining": remaining,
			})
		} else {
			ttl, _ := connections.RedisClient.TTL(connections.RedisCtx, rateLimitKey).Result()
			if ttl > 0 {
				c.Header("Retry-After", fmt.Sprintf("%d", int(ttl.Seconds())+1))
			}
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Too many incorrect attempts. Please wait 15 minutes before trying again."})
		}
		return
	}

	// Correct OTP — clear the rate limit counter
	connections.RedisClient.Del(connections.RedisCtx, rateLimitKey)

	user.IsVerified = true
	user.VerificationToken = ""
	if db.Save(&user).Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Request Failed, Please try again later"})
		return
	}
	accessToken, err := middleware.GenerateAccessToken(user.UserID)
	if err != nil {
		// TODO: Redirect to login page
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token, you will need to login!"})
		return
	}
	refreshToken, err := middleware.GenerateRefreshToken(user.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token, you will need to login!"})
		return
	}
	// set cookie
	middleware.ClearAuthCookie(c) // Clear the previous cookie

	// TODO: Make sure both cookies are set properly, i observed previously that only auth cookie was being set after otp verification
	middleware.SetRefreshCookie(c, refreshToken)
	middleware.SetAuthCookie(c, accessToken)
	c.JSON(http.StatusOK, gin.H{"message": "Email verification successful."})
}
