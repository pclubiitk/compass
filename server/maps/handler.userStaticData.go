//mytask done

package maps

import (
	"compass/connections"
	"compass/model"
	"fmt"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/microcosm-cc/bluemonday"
)

func noticeProvider(c *gin.Context) {
	pageSize := 10

	// Get page number from path param
	pageStr := c.Query("page")
	start := c.Query("start")
	end := c.Query("end")
	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		// If conversion fails or page is less than 1
		c.JSON(400, gin.H{"error": "Invalid page number"})
		return
	}

	offset := (page - 1) * pageSize
	var noticeList []model.Notice

	// Fetch from DB with limit and offset
	result := connections.DB.
		Where("created_at BETWEEN ? AND ?", start, end).
		Order("created_at DESC").
		Limit(pageSize).
		Offset(offset).
		Find(&noticeList)

	var count int64
	if err := connections.DB.Model(&model.Notice{}).Count(&count).Error; err != nil {
		// handle error
		fmt.Println("Error counting users:", err)
		return
	}

	p := bluemonday.UGCPolicy() // User-Generated Content policy
	for i := range noticeList {
		noticeList[i].Description = p.Sanitize(noticeList[i].Description)
	}



	// Check DB error
	if result.Error != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch notices"})
		return
	}

	// Return the result
	c.JSON(200, gin.H{
		"page":             page,
		"page_size":        pageSize,
		"noticeboard_list": noticeList,
		"total": 			count,
	})
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

	// hasMore := offset+len(reviews) < total

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
