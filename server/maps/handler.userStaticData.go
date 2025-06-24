package maps

import (
	"github.com/gin-gonic/gin"
	"compass/connections"
	"compass/model"
)

func noticeProvider(c *gin.Context) {
	// Details in router.go

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation
}

func locationProvider(c *gin.Context) {
	// Details in router.go
	var locations []model.Location

	err := connections.DB.
		Model(&model.Location{}).
		Where("status = ?", "approved").
		Select("location_id", "name", "latitude", "longitude").
		Find(&locations).Error

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch locations"})
		return
	}

	c.JSON(200, gin.H{"locations": locations})
	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation

}

func locationDetailProvider(c *gin.Context) {
	// Details in router.go
	id := c.Param("id")

	var loc model.Location
	err := connections.DB.
		Model(&model.Location{}).
		Where("location_id = ? AND status = ?", id, "approved").
		First(&loc).Error

	if err != nil {
		c.JSON(404, gin.H{"error": "Location not found"})
		return
	}

	c.JSON(200, gin.H{"location": loc})
	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation

}

func reviewProvider(c *gin.Context) {
	// Details in router.go

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation

}
