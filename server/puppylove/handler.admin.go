package puppylove

import (
	"compass/connections"
	"compass/model/puppylove"
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
)

func PublishResults(c *gin.Context) {
	if !IsPuppyLoveResultsPublished() {
		var matchdb puppylove.MatchTable
		var matches []puppylove.MatchTable
		records := connections.DB.Model(&matchdb).Find(&matches)
		if records.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Some error occurred while calculating matches"})
			return
		}

		for _, match := range matches {
			roll1 := match.Roll1
			roll2 := match.Roll2
			song12 := match.SONG12 // Song sent by roll2 to roll1
			song21 := match.SONG21 // Song sent by roll1 to roll2

			var userdb puppylove.PuppyLoveProfile
			var userdb1 puppylove.PuppyLoveProfile

			// Fetch user1
			if err := connections.DB.Model(&userdb).Where("roll_no = ?", roll1).First(&userdb).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error occurred while fetching user1"})
				return
			}

			// Fetch user2
			if err := connections.DB.Model(&userdb1).Where("roll_no = ?", roll2).First(&userdb1).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error occurred while fetching user2"})
				return
			}

			// Only proceed if both users have opted to publish their results
			if userdb.Publish && userdb1.Publish {
				// Unmarshal existing matches
				var matches1, matches2 map[string]string
				if len(userdb.Matches) > 0 {
					_ = json.Unmarshal(userdb.Matches, &matches1)
				} else {
					matches1 = make(map[string]string)
				}

				if len(userdb1.Matches) > 0 {
					_ = json.Unmarshal(userdb1.Matches, &matches2)
				} else {
					matches2 = make(map[string]string)
				}

				// Add new matches
				matches1[roll2] = song21
				matches2[roll1] = song12

				// Marshal back into json.RawMessage
				userdb.Matches, _ = json.Marshal(matches1)
				userdb1.Matches, _ = json.Marshal(matches2)

				// Save the updated user records
				connections.DB.Save(&userdb)
				connections.DB.Save(&userdb1)
			}
		}
		if err := SetPuppyLoveConfig(puppylove.ConfigKeyResultsPublished, "true"); err != nil {
			c.JSON(http.StatusAccepted, gin.H{"msg": "Matches updated successfully, but publish config can't be set to true"})
		}
		c.JSON(http.StatusOK, gin.H{"msg": "Published Matches"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"msg": "Matches already published"})
}

func TogglePermit(c *gin.Context) {
	var newPermit string
	if IsPuppyLovePermitted() {
		newPermit = "false"
	} else {
		newPermit = "true"
	}
	if err := SetPuppyLoveConfig(puppylove.ConfigKeyPermit, newPermit); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set permit config"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"permitStatus": newPermit})
}
