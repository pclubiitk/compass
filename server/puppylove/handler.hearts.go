package puppylove

import (
	"compass/connections"
	"compass/model/puppylove"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// FetchPublicKeys returns all public keys, using Redis cache if available
func FetchPublicKeys(c *gin.Context) {
	// Try to get from Redis cache first
	publicKeysMap, err := connections.RedisClient.HGetAll(connections.RedisCtx, "puppylove:public_keys").Result()
	if err == nil && len(publicKeysMap) > 0 {
		c.JSON(http.StatusOK, publicKeysMap)
		return
	}

	// Fetch from database
	var publicKeys []UserPublicKey
	if err := connections.DB.Model(&puppylove.PuppyLoveProfile{}).
		Select("roll_no, pub_k").
		Where("pub_k != ''").
		Find(&publicKeys).Error; err != nil {
		logrus.WithError(err).Error("Failed to fetch public keys")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch public keys"})
		return
	}

	// Build response and cache in Redis
	responseMap := make(map[string]string)
	for _, key := range publicKeys {
		connections.RedisClient.HSet(connections.RedisCtx, "puppylove:public_keys", key.Id, key.PubK)
		responseMap[key.Id] = key.PubK
	}

	c.JSON(http.StatusOK, responseMap)
}

func FetchReturnHearts(c *gin.Context) {
	rollNo, exists := c.Get("rollNo")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID not found in context"})
		return
	}

	type Time struct {
		ReturnHeartsTimestamp string `json:"return_hearts_timestamp"`
	}
	var userTimestamp Time
	if err := connections.DB.Model(&puppylove.PuppyLoveProfile{}).
		Select("return_hearts_timestamp").
		Where("roll_no = ?", rollNo).
		Scan(&userTimestamp).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user timestamp"})
		}
		return
	}
	layout := "2006-01-02T15:04:05.999999999Z07:00" // RFC 3339 format
	timestamp, err := time.Parse(layout, userTimestamp.ReturnHeartsTimestamp)
	if err != nil {
		fmt.Println("Failed to parse timestamp:", userTimestamp.ReturnHeartsTimestamp)
		fmt.Println("Error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid timestamp format"})
		return
	}
	var returnedHeart puppylove.ReturnHearts
	var returnedHearts []FetchReturnedHearts
	if err := connections.DB.Model(&returnedHeart).
		Select("enc").
		Where("created_at > ?", timestamp).
		Find(&returnedHearts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch returned hearts"})
		return
	}
	newTimestamp := time.Now().UTC().Add(-1 * time.Minute).Format(time.RFC3339)
	if err := connections.DB.Model(&puppylove.PuppyLoveProfile{}).
		Where("roll_no = ?", rollNo).
		Update("return_hearts_timestamp", newTimestamp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user timestamp"})
		return
	}

	c.JSON(http.StatusOK, returnedHearts)
}

// FetchHearts fetches hearts sent to the authenticated user
func FetchHearts(c *gin.Context) {
	roll_no, exists := c.Get("rollNo")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID not found in context"})
		return
	}
	type Time struct {
		SendHeartsTimestamp string `json:"send_hearts_timestamp"`
	}
	var userTimestamp Time

	if err := connections.DB.Model(&puppylove.PuppyLoveProfile{}).
		Select("send_hearts_timestamp").
		Where("roll_no = ?", roll_no).
		Scan(&userTimestamp).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user timestamp"})
		}
		return
	}
	layout := "2006-01-02T15:04:05.999999999Z07:00" // RFC 3339 format
	timestamp, err := time.Parse(layout, userTimestamp.SendHeartsTimestamp)
	if err != nil {
		fmt.Println("Failed to parse timestamp:", userTimestamp.SendHeartsTimestamp)
		fmt.Println("Error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid timestamp format"})
		return
	}
	var heart puppylove.SendHeart
	var hearts []FetchHeartsFirst

	if err := connections.DB.Model(&heart).
		Select("enc, gender_of_sender").
		Where("created_at > ?", timestamp).
		Find(&hearts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch hearts"})
		return
	}
	newTimestamp := time.Now().UTC().Add(-1 * time.Minute).Format(time.RFC3339)
	if err := connections.DB.Model(&puppylove.PuppyLoveProfile{}).
		Where("roll_no = ?", roll_no).
		Update("send_hearts_timestamp", newTimestamp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user timestamp"})
		return
	}
	c.JSON(http.StatusOK, hearts)
}

// SentHeartDecoded verifies decoded hearts and returns match counts
func SentHeartDecoded(c *gin.Context) {
	info := new(SentHeartsDecoded)
	if err := c.BindJSON(info); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Input data format."})
		return
	}

	var heart puppylove.SendHeart
	var hearts []puppylove.SendHeart

	fetchHeart := connections.DB.Model(&heart).Select("sha", "enc", "gender_of_sender").Find(&hearts)

	if fetchHeart.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No heart to fetch"})
	}

	matchCount := struct {
		male   int
		female int
	}{
		0,
		0,
	}

	for index, heart := range info.DecodedHearts {
		enc := heart.Enc
		gender := heart.GenderOfSender
		if gender != hearts[index].GenderOfSender {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Data not in sequence"})
			return
		}
		if enc == hearts[index].ENC {
			if gender == "M" {
				matchCount.male += 1
			} else {
				matchCount.female += 1
			}
		}
	}
	c.JSON(http.StatusOK, gin.H{"male": matchCount.male, "female": matchCount.female})
}

// GetStats returns PuppyLove statistics (only when results are published)
func GetStats(c *gin.Context) {
	if !IsPuppyLoveResultsPublished() {
		c.JSON(http.StatusOK, gin.H{"msg": "Stats Not yet published"})
		return
	}
	if StatsFlag {
		StatsFlag = false
		var profiles []puppylove.PuppyLoveProfile

		records := connections.DB.Model(&puppylove.PuppyLoveProfile{}).Where("dirty = ?", true).Find(&profiles)
		if records.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error Fetching Stats"})
			return
		}

		for _, profile := range profiles {
			if len(profile.RollNo) >= 2 && profile.Dirty {
				if profile.Gender == "M" {
					MaleRegisters++
				} else {
					FemaleRegisters++
				}
				RegisterMap["y"+profile.RollNo[0:2]]++

				if string(profile.Matches) == "" {
					continue
				}
				var matchMap map[string]string
				err := json.Unmarshal([]byte(profile.Matches), &matchMap)
				if err != nil {
					log.Print("Error parsing matches JSON: ", err)
					continue
				}
				matchCount := len(matchMap)

				if matchCount != 0 {
					NumberOfMatches += matchCount
					for matchID := range matchMap {
						if len(matchID) >= 2 {
							batchYear := "y" + matchID[0:2]
							MatchMap[batchYear]++
						}
					}
				}
			}
		}
	}
	c.JSON(http.StatusOK, gin.H{
		"totalRegisters":        MaleRegisters + FemaleRegisters,
		"femaleRegisters":       FemaleRegisters,
		"maleRegisters":         MaleRegisters,
		"batchwiseRegistration": RegisterMap,
		"totalMatches":          NumberOfMatches,
		"batchwiseMatches":      MatchMap,
	})
}

// Helper function to check if results are published
func IsPuppyLoveResultsPublished() bool {
	value, exists := GetPuppyLoveConfigFromDB(ConfigKeyResultsPublished)
	if !exists {
		return false
	}
	return value == "true"
}

// GetPuppyLoveConfigFromDB is a local helper to avoid import cycle
func GetPuppyLoveConfigFromDB(key string) (string, bool) {
	var config puppylove.PuppyLoveConfig
	if err := connections.DB.Where("key = ?", key).First(&config).Error; err != nil {
		return "", false
	}
	return config.Value, true
}

const ConfigKeyResultsPublished = "puppylove_results_published"
