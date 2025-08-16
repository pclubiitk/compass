package maps

import (
	"compass/connections"
	"compass/model"
	"compass/workers"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

func addReview(c *gin.Context) {
	var req AddReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}
	// TODO: Extract this logic out, need something more elegant
	userID, exist := c.Get("userID")
	if !exist {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	// TODO: If the location is not yet approved but somehow the hacker is trying to add location
	// Get new review
	newReview := req.ToReview(userID.(uuid.UUID))
	var missingCount, unableToModerate = 0, 0
	var images []model.Image
	// TODO: Empty Review should not be allowed
	// Transaction will combine all steps and will do nothing if any error occurs
	if err := connections.DB.Transaction(func(tx *gorm.DB) error {
		// Create review
		if err := tx.Create(&newReview).Error; err != nil {
			return err
		}
		// Associate images
		if len(*req.Images) > 0 {
			if err := tx.Where("image_id IN ?", *req.Images).Find(&images).Error; err != nil {
				return err
			}
			if err := tx.Model(&newReview).Association("Images").Replace(&images); err != nil {
				return err
			}
			missingCount += len(*req.Images) - len(images)
		}
		return nil
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to process review addition"})
		fmt.Print(err)
		return
	}

	// Add the text into moderation
	payload, _ := json.Marshal(workers.ModerationJob{
		AssetID: newReview.ReviewId,
		Type:    model.ModerationTypeReviewText,
	})
	if err := workers.PublishJob(payload, model.ModerationQueue); err != nil {
		logrus.Infof("Unable to publish text moderation job for review id: %s", newReview.ReviewId)
		unableToModerate++
	}

	// Publish the job for each image
	for _, img := range images {
		payload, _ := json.Marshal(workers.ModerationJob{
			AssetID: img.ImageID,
			Type:    model.ModerationTypeImage,
		})
		if err := workers.PublishJob(payload, model.ModerationQueue); err != nil {
			logrus.Infof("Unable to publish image moderation job for image id: %d", img.ImageID)
			unableToModerate++
			continue
		}
	}
	// Write response
	if missingCount > 0 || unableToModerate > 0 {
		c.JSON(http.StatusOK, gin.H{
			"message": fmt.Sprintf(
				"Your review is under process. %d items (text/images) were dropped and %d could not be processed by moderator due to internal errors.",
				missingCount, unableToModerate,
			),
		})
	} else {
		c.JSON(http.StatusOK, gin.H{"message": "Your Review is under process, it will be public soon!"})
	}
}

func requestLocationAddition(c *gin.Context) {
	var req AddLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}
	// TODO: Extract this logic out, need something more elegant
	userID, exist := c.Get("userID")
	if !exist {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	// Get the new location model
	newLocation := req.ToLocation(userID.(uuid.UUID))
	var missingCount int
	if len(newLocation.Name) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Place Name"})
		return
	}
	// Transaction will combine all steps and will do nothing if any error occurs
	if err := connections.DB.Transaction(func(tx *gorm.DB) error {
		// Create location
		if err := tx.Create(&newLocation).Error; err != nil {
			return err
		}
		// Associate CoverPic
		if req.CoverPic != nil {
			var coverPic model.Image
			if err := tx.First(&coverPic, "image_id = ?", *req.CoverPic).Error; err == nil {
				if err := tx.Model(&newLocation).Association("CoverPic").Replace(&coverPic); err != nil {
					return err
				}
			} else {
				missingCount++
			}
		}
		// Associate BioPics
		if len(*req.BioPics) > 0 {
			var bioPics []model.Image
			if err := tx.Where("image_id IN ?", *req.BioPics).Find(&bioPics).Error; err != nil {
				return err
			}
			if err := tx.Model(&newLocation).Association("BioPics").Replace(&bioPics); err != nil {
				return err
			}
			missingCount += len(*req.BioPics) - len(bioPics)
		}
		return nil
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to request location addition"})
		return
	}
	if missingCount > 0 {
		c.JSON(http.StatusOK, gin.H{
			"message": fmt.Sprintf("Location request submitted for review. But %d images could not be attached, due to server error", missingCount),
		})
	} else {
		c.JSON(http.StatusOK, gin.H{"message": "Location request submitted for review"})
	}
}
