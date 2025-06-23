package maps

import "github.com/gin-gonic/gin"

func systemLogsProvider(c *gin.Context) {
	// static data, provide the logs, try to modify the route such that you enable pagination

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation
}

func flaggedReviewsProvider(c *gin.Context) {

	var reviews []model.Review

	if err := connections.DB.
		WithContext(c.Request.Context()).
		Select("id, content, status").
		Table("reviews").
		Where("status = ?", "rejected_by_bot").
		Find(&reviews).Error; err != nil {
		c.JSON(500, gin.H{"error": "Database error", "details": err.Error()})
		return
	}

	if len(reviews) == 0 {
		c.JSON(404, gin.H{"message": "No flagged reviews found"})
		return
	}

	c.JSON(200, gin.H{"flagged_reviews": reviews})
}

func locationRequestProvider(c *gin.Context) {
	// filter the pending location requests

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation
}

func indicatorProvider(c *gin.Context) {
	// add helper functions, and provide the indicators to the user
}
