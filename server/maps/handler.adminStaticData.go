package maps

import (
	"github.com/gin-gonic/gin"
	"compass/connections"
)

func systemLogsProvider(c *gin.Context) {
	// static data, provide the logs, try to modify the route such that you enable pagination

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation
}

func flaggedReviewsProvider(c *gin.Context) {
	// filter the bot rejected reviews

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation
}

func locationRequestProvider(c *gin.Context) {
	// filter the pending location requests
	var pending []RequestAddLocation

	err := connections.DB.
		Model(&RequestAddLocation{}).
		Where("status = ?", "pending").
		Find(&pending).Error

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch pending location requests"})
		return
	}

	c.JSON(200, gin.H{
		"requests": pending,
	})
	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation
}
//done
func indicatorProvider(c *gin.Context) {
	// add helper functions, and provide the indicators to the user
}