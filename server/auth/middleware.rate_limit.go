package auth

import (
	"compass/connections"
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

// verificationRateLimit limits OTP guesses for a verification target. Redis makes
// the limit apply across auth server instances and prevents bypass via IP rotation.
func verificationRateLimit(c *gin.Context) {
	userID, err := uuid.Parse(c.Query("userID"))
	if err != nil {
		// Let the handler return its normal validation error for malformed requests.
		return
	}

	key := fmt.Sprintf("rate_limit:email_verification:%s", userID)
	attempts, err := connections.RedisClient.Incr(connections.RedisCtx, key).Result()
	if err != nil {
		// Availability of Redis should not prevent a legitimate user from verifying
		// their account, but the failure must be visible to operators.
		logrus.WithError(err).Error("failed to apply email verification rate limit")
		return
	}
	if attempts == 1 {
		if err := connections.RedisClient.Expire(connections.RedisCtx, key, verificationWindow).Err(); err != nil {
			logrus.WithError(err).Error("failed to set email verification rate limit expiry")
			if err := connections.RedisClient.Del(connections.RedisCtx, key).Err(); err != nil {
				logrus.WithError(err).Error("failed to clean up email verification rate limit")
			}
			return
		}
	}

	if attempts <= verificationMaxAttempts {
		return
	}

	ttl, err := connections.RedisClient.TTL(connections.RedisCtx, key).Result()
	if err == nil && ttl > 0 {
		c.Header("Retry-After", fmt.Sprintf("%d", int(ttl.Seconds())+1))
	}
	c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
		"error": "Too many verification attempts. Please try again later.",
	})
}
