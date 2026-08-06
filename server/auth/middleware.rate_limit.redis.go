package auth

import (
	"compass/connections"
	"time"
)

type redisVerificationAttemptStore struct{}

func (redisVerificationAttemptStore) Increment(key string) (int64, error) {
	return connections.RedisClient.Incr(connections.RedisCtx, key).Result()
}

func (redisVerificationAttemptStore) Expire(key string, expiry time.Duration) error {
	return connections.RedisClient.Expire(connections.RedisCtx, key, expiry).Err()
}

func (redisVerificationAttemptStore) TTL(key string) (time.Duration, error) {
	return connections.RedisClient.TTL(connections.RedisCtx, key).Result()
}

func (redisVerificationAttemptStore) Delete(key string) error {
	return connections.RedisClient.Del(connections.RedisCtx, key).Err()
}

func init() {
	verificationAttempts = redisVerificationAttemptStore{}
}
