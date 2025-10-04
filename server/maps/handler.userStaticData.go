package maps

import (
	"compass/connections"
	"compass/model"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"gorm.io/gorm"
)

func noticeProvider(c *gin.Context) {
	// Extract page number, if issue default to 1
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil {
		page = 1
	}
	offset := (page - 1) * viper.GetInt("noticeboard.limit")

	var noticeList []model.Notice
	if connections.DB.
		Model(&model.Notice{}).
		Preload("User", connections.UserSelect).
		Order("created_at DESC").
		Limit(viper.GetInt("noticeboard.limit")).
		Offset(offset). // set page
		Find(&noticeList).
		Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notices"})
		return
	}
	// Count total pages
	var count int64 = -1
	if err := connections.DB.Model(&model.Notice{}).Count(&count).Error; err != nil {
		logrus.Errorf("Failed to count notices: %v", err)
		return
	}
	// TODO: handling if count is -1, then don't show the count field, there is some error
	c.JSON(200, gin.H{
		"noticeboard_list": noticeList,
		"total_notices":    count,
		"current_page":     page,
	})
}

func locationProvider(c *gin.Context) {
	// TODO: write a pagination logic
	var locations []model.Location

	err := connections.DB.
		Model(&model.Location{}).
		Where("status = ?", model.Approved).
		Select("location_id", "name", "latitude", "longitude").
		Find(&locations).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch locations"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"locations": locations})
	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation

}

func locationDetailProvider(c *gin.Context) {
	id := c.Param("id")
	var loc model.Location
	if err := connections.DB.
		Model(&model.Location{}).
		Preload("User", connections.UserSelect). // Location contributor
		Preload("Reviews", func(db *gorm.DB) *gorm.DB {
			return db.Where("status = ?", model.Approved).
				Order("created_at DESC").
				Limit(5)
		}).
		Preload("Reviews.User", connections.UserSelect). // Review contributors
		Where("location_id = ? AND status = ?", id, model.Approved).
		First(&loc).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Error Fetching location"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"location": loc})

}

func reviewProvider(c *gin.Context) {
	locationID := c.Param("id")

	if locationID == "" {
		c.JSON(400, gin.H{"error": "location_id is required"})
		return
	}

	page := 1
	limit := 50
	if p := c.Param("page"); p != "" {
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

	if err := db.Preload("User").Where("location_id = ?", locationID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&reviews).Error; err != nil {
		return nil, 0, err
	}

	return reviews, int(total), nil
}
