package puppylove

import (
	"compass/connections"
	"compass/model/puppylove"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func GetPuppyLoveConfig(key string) (string, bool) {
	var config puppylove.PuppyLoveConfig
	if err := connections.DB.Where("key = ?", key).First(&config).Error; err != nil {
		return "", false
	}
	return config.Value, true
}

func SetPuppyLoveConfig(key, value string) error {
	config := puppylove.PuppyLoveConfig{
		Key:   key,
		Value: value,
	}
	return connections.DB.Where(puppylove.PuppyLoveConfig{Key: key}).Assign(puppylove.PuppyLoveConfig{Value: value}).FirstOrCreate(&config).Error
}

func InitPuppyLoveConfig() {
	defaults := map[string]string{
		puppylove.ConfigKeyPermit:           puppylove.DefaultPermit,
		puppylove.ConfigKeyResultsPublished: puppylove.DefaultResultsPublished,
		puppylove.ConfigKeyMode:             puppylove.DefaultMode,
	}

	for key, defaultValue := range defaults {
		if _, exists := GetPuppyLoveConfig(key); !exists {
			if err := SetPuppyLoveConfig(key, defaultValue); err != nil {
				logrus.WithError(err).Errorf("Failed to initialize PuppyLove config: %s", key)
			} else {
				logrus.Infof("Config Initialized: %s = %s", key, defaultValue)
			}
		}
	}
}

func IsPuppyLoveEnabled() bool {
	mode, exists := GetPuppyLoveConfig(puppylove.ConfigKeyMode)
	if !exists {
		return false
	}
	return mode != "inactive"
}

func GetPuppyLoveMode() string {
	mode, exists := GetPuppyLoveConfig(puppylove.ConfigKeyMode)
	if !exists {
		return puppylove.DefaultMode
	}
	return mode
}

func IsPuppyLovePermitted() bool {
	permit, exists := GetPuppyLoveConfig(puppylove.ConfigKeyPermit)
	if !exists {
		return false
	}
	return permit == "true"
}

// middleware
func PuppyLovePermit() gin.HandlerFunc {
	return func(c *gin.Context) {
		permit := IsPuppyLovePermitted()
		if permit {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Not Permitted by Admin"})
		}
		c.Next()
	}
}
