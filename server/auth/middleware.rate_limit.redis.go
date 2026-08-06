package auth

import (
	"compass/connections"
	"errors"
	"time"
)

type redisVerificationAttemptStore struct{}

var errVerificationRedisUnavailable = errors.New("verification rate-limit store is unavailable")

func (redisVerificationAttemptStore) Increment(key string) (int64, error) {
	if connections.RedisClient == nil {
		return 0, errVerificationRedisUnavailable
	}
	return connections.RedisClient.Incr(connections.RedisCtx, key).Result()
}

func (redisVerificationAttemptStore) Expire(key string, expiry time.Duration) error {
	if connections.RedisClient == nil {
		return errVerificationRedisUnavailable
	}
	return connections.RedisClient.Expire(connections.RedisCtx, key, expiry).Err()
}

func (redisVerificationAttemptStore) TTL(key string) (time.Duration, error) {
	if connections.RedisClient == nil {
		return 0, errVerificationRedisUnavailable
	}
	return connections.RedisClient.TTL(connections.RedisCtx, key).Result()
}

func (redisVerificationAttemptStore) Delete(key string) error {
	if connections.RedisClient == nil {
		return errVerificationRedisUnavailable
	}
	return connections.RedisClient.Del(connections.RedisCtx, key).Err()
}

func init() {
	verificationAttempts = redisVerificationAttemptStore{}
}
