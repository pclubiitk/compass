package puppylove

import (
	"compass/connections"
	"compass/model/puppylove"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func UpdateAbout(c *gin.Context) {
	about := new(UpdateAboutReq)
	if err := c.BindJSON(about); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Input data format."})
		return
	}
	if len(about.About) > 70 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Too long about."})
		return
	}
	roll_no, _ := c.Get("rollNo")
	user := puppylove.PuppyLoveProfile{}

	record := connections.DB.Model((&user)).Where("roll_no = ?", roll_no).Update("about", about.About)
	if record.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Some Error occured Please try later"})
		return
	}
	c.JSON(http.StatusAccepted, gin.H{"message": "Update Successful!"})
}

func UpdateInterest(c *gin.Context) {
	interestReq := new(UpdateInterestReq)
	if err := c.BindJSON(interestReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Input data format."})
		return
	}
	roll_no, _ := c.Get("rollNo")
	user := puppylove.PuppyLoveProfile{}

	// to save our server form very very long tags.
	if len(interestReq.Interests) > 50 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Too long tags."})
		return
	}

	record := connections.DB.Model((&user)).Where("roll_no = ?", roll_no).Update("interests", interestReq.Interests)
	if record.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Some Error occured Please try later"})
		return
	}
	c.JSON(http.StatusAccepted, gin.H{"message": "Update Successful!"})
}

func GetAllUsersInfo(c *gin.Context) {
	redisUserAboutMap, err1 := connections.RedisClient.HGetAll(connections.RedisCtx, "puppylove:about_map").Result()
	redisUserInterestMap, err2 := connections.RedisClient.HGetAll(connections.RedisCtx, "puppylove:interests_map").Result()

	// currently we are checking both err1 and err2 to be nil,
	// we can change it to check one at a time.
	// but if we request the data base twice like it will be very heavy task.

	if err1 == nil && err2 == nil && len(redisUserAboutMap) > 0 && len(redisUserInterestMap) > 0 {
		c.JSON(http.StatusOK, gin.H{"about": redisUserAboutMap, "interests": redisUserInterestMap})
		return
	}
	var userInfo []UserInfo

	// later we can, modify it to only return the active users
	fetchUsersInfo := connections.DB.Select("user_id", "about", "interests").Where("dirty = ?", true).Find(&userInfo)
	if fetchUsersInfo.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Some error occured"})
		return
	}
	aboutMap := make(map[string]string)
	interestsMap := make(map[string]string)
	expiryTime := 1 * time.Hour

	for _, profile := range userInfo {
		userIDStr := profile.Id
		connections.RedisClient.HSet(connections.RedisCtx, "puppylove:about_map", userIDStr, profile.About)
		connections.RedisClient.HSet(connections.RedisCtx, "puppylove:interests_map", userIDStr, profile.Interests)

		aboutMap[userIDStr] = profile.About
		interestsMap[userIDStr] = profile.Interests
	}

	// setting expiry time for the keys to 1 hour
	connections.RedisClient.Expire(connections.RedisCtx, "puppylove:about_map", expiryTime)
	connections.RedisClient.Expire(connections.RedisCtx, "puppylove:interests_map", expiryTime)

	c.JSON(http.StatusOK, gin.H{"about": aboutMap, "interests": interestsMap})
}


