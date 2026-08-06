package auth

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

const (
	verificationMaxAttempts = 3
	verificationWindow      = 15 * time.Minute
)

type verificationAttemptStore interface {
	Increment(key string) (int64, error)
	Expire(key string, expiry time.Duration) error
	TTL(key string) (time.Duration, error)
	Delete(key string) error
}

var verificationAttempts verificationAttemptStore

func verificationLockoutMessage() string {
	minutes := int(verificationWindow.Minutes())
	if minutes == 1 {
		return "Too many incorrect attempts. Please wait 1 minute before trying again."
	}
	return fmt.Sprintf("Too many incorrect attempts. Please wait %d minutes before trying again.", minutes)
}

// verificationRateLimit limits OTP guesses for a verification target. Redis makes
// the limit apply across auth server instances and prevents bypass via IP rotation.
func verificationRateLimit(c *gin.Context) {
	userID, err := uuid.Parse(c.Query("userID"))
	if err != nil {
		// Let the handler return its normal validation error for malformed requests.
		return
	}

	key := fmt.Sprintf("rate_limit:email_verification:%s", userID)
	if verificationAttempts == nil {
		logrus.Error("email verification rate-limit store is not configured")
		c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{
			"error": "Verification temporarily unavailable, please try again later.",
		})
		return
	}
	attempts, err := verificationAttempts.Increment(key)
	if err != nil {
		// Fail closed: without the shared counter, accepting guesses would make the
		// OTP brute-forceable whenever Redis is degraded.
		logrus.WithError(err).Error("failed to apply email verification rate limit")
		c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{
			"error": "Verification temporarily unavailable, please try again later.",
		})
		return
	}
	if attempts == 1 {
		if err := verificationAttempts.Expire(key, verificationWindow); err != nil {
			logrus.WithError(err).Error("failed to set email verification rate limit expiry")
			if cleanupErr := verificationAttempts.Delete(key); cleanupErr != nil {
				logrus.WithError(cleanupErr).Error("failed to clean up email verification rate limit")
			}
			c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{
				"error": "Verification temporarily unavailable, please try again later.",
			})
			return
		}
	}

	if attempts <= verificationMaxAttempts {
		return
	}

	ttl, err := verificationAttempts.TTL(key)
	if err == nil && ttl > 0 {
		c.Header("Retry-After", fmt.Sprintf("%d", int(ttl.Seconds())+1))
	}
	c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
		"error": verificationLockoutMessage(),
	})
}
