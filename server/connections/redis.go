package connections

import (
	"context"
	"fmt"
	"os"

	"github.com/redis/go-redis/v9"
)

var (
	RedisCtx    = context.Background()
	RedisClient *redis.Client
)

func InitRedis() error {
	host := os.Getenv("REDIS_HOST")
	port := os.Getenv("REDIS_PORT")

	// Fallback
	if host == "" {
		host = "localhost"
	}
	if port == "" {
		port = "6379"
	}

	addr := fmt.Sprintf("%s:%s", host, port)

	RedisClient = redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: "",
		DB:       0,
	})
	return nil
}

func GetRedisClient() *redis.Client {
	return RedisClient
}

func ViewRedis() {
	keys, err := RedisClient.Keys(RedisCtx, "*").Result()
	if err != nil {
		fmt.Println("Error fetching keys:", err)
		return
	}
	for _, key := range keys {
		val, err := RedisClient.HGetAll(RedisCtx, key).Result()
		if err != nil {
			fmt.Printf("Error fetching value for key %s: %v\n", key, err)
			continue
		}
		fmt.Printf("Key: %s, Value: %v\n", key, val)
	}
}
