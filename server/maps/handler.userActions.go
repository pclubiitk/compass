package maps

import (
	"github.com/gin-gonic/gin"
	"compass/connections"
)

func addReview(c *gin.Context) {
	// add the request model in the respective file

	// add the review in the database with a pending status

	// Future TODO: add a logic to prevent attack on this route

	// add a task for the moderator to process that request
}

func requestLocationAddition(c *gin.Context) {
	// add the request model in the respective file
	var req RequestAddLocation

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	// Validate required fields
	if req.Title == "" || req.Contributor_id == "" || req.Latitude == 0 || req.Longitude == 0 {
		c.JSON(400, gin.H{"error": "Missing required fields"})
		return
	}

	// add the location in the table with a pending status
	req.Status = "pending"

	if err := connections.DB.Create(&req).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to save location request"})
		return
	}

	c.JSON(200, gin.H{"message": "Location request submitted for review"})
	// Future TODO: add a logic to prevent attack on this route

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation
}
