//mytask done

package maps

import (
	"compass/connections"
	"compass/model"
	"fmt"
	"github.com/gin-gonic/gin"
)

func noticeProvider(c *gin.Context) {
	// Details in router.go

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation
}

func locationProvider(c *gin.Context) {
	// Details in router.go

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation

}

func locationDetailProvider(c *gin.Context) {
	// Details in router.go

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation

}

func reviewProvider(c *gin.Context) {
	locationID := c.Query("location_id")
	if locationID == "" {
		c.JSON(400, gin.H{"error": "location_id is required"})
		return
	}

	page := 1
	limit := 50
	if p := c.Query("page"); p != "" {
		if parsedPage, err := strconv.Atoi(p); err != nil || parsedPage < 1 {
			c.JSON(400, gin.H{"error": "invalid page parameter"})
			return
		} else {
			page = parsedPage
		}
	}

	offset := (page - 1) * limit

	reviews, total, err := fetchReviewsByLocationID(locationID, limit, offset)
	if err != nil {
		c.JSON(500, gin.H{"error": "failed to fetch reviews"})
		return
	}

	hasMore := offset+len(reviews) < total
	c.JSON(200, gin.H{
		"reviews": reviews,
		"page":    page,
		"total":   total,
	})
}

func fetchReviewsByLocationID(locationID string, limit, offset int) ([]model.Review, int, error) {
	var reviews []model.Review
	var total int64
	db := connections.DB

	if err := db.Model(&model.Review{}).Where("location_id = ?", locationID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := db.Where("location_id = ?", locationID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&reviews).Error; err != nil {
		return nil, 0, err
	}

	return reviews, int(total), nil
}
