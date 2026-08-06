package maps

import (
	"compass/connections"
	"compass/model"
	"compass/workers"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

var errReviewImageForbidden = errors.New("review contains an image not owned by the user")

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

	userUUID := userID.(uuid.UUID)
	newReview := req.ToReview(userUUID)
	var unableToModerate int
	var images []model.Image

	// Transaction will combine all steps and will do nothing if any error occurs
	if err := connections.DB.Transaction(func(tx *gorm.DB) error {
		// Resolve every requested image through the ownership boundary before the
		// review is created. Missing and other users' IDs are both rejected.
		if req.Images != nil && len(*req.Images) > 0 {
			if err := tx.Where(
				"image_id IN ? AND owner_id = ? AND (parent_asset_id IS NULL OR parent_asset_id = ?) AND (parent_asset_type IS NULL OR parent_asset_type = '')",
				*req.Images,
				userUUID,
				uuid.Nil,
			).Find(&images).Error; err != nil {
				return err
			}
			if !allRequestedImagesAvailable(*req.Images, images) {
				return errReviewImageForbidden
			}
		}

		if err := tx.Create(&newReview).Error; err != nil {
			return err
		}

		if len(images) > 0 {
			result := tx.Model(&model.Image{}).
				Where(
					"image_id IN ? AND owner_id = ? AND (parent_asset_id IS NULL OR parent_asset_id = ?) AND (parent_asset_type IS NULL OR parent_asset_type = '')",
					*req.Images,
					userUUID,
					uuid.Nil,
				).
				Updates(map[string]interface{}{
					"parent_asset_id":   newReview.ReviewId,
					"parent_asset_type": "Review",
				})
			if result.Error != nil {
				return result.Error
			}
			if result.RowsAffected != int64(uniqueImageIDCount(*req.Images)) {
				return errReviewImageForbidden
			}
		}
		return nil
	}); err != nil {
		if errors.Is(err, errReviewImageForbidden) {
			c.JSON(http.StatusForbidden, gin.H{"error": "One or more images do not belong to the current user"})
			return
		}
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
			AssetID: img.ImageID, // Using the struct array we loaded earlier
			Type:    model.ModerationTypeImage,
		})
		if err := workers.PublishJob(payload, model.ModerationQueue); err != nil {
			logrus.Infof("Unable to publish image moderation job for image id: %d", img.ImageID)
			unableToModerate++
			continue
		}
	}

	// Write response
	if unableToModerate > 0 {
		c.JSON(http.StatusOK, gin.H{
			"message": fmt.Sprintf(
				"Your review is under process.\nWhile processing:\n- %d items not processed by moderator.",
				unableToModerate,
			),
		})
	} else {
		c.JSON(http.StatusOK, gin.H{"message": "Your Review is under process, it will be public soon!"})
	}
}

func uniqueImageIDCount(imageIDs []uuid.UUID) int {
	unique := make(map[uuid.UUID]struct{}, len(imageIDs))
	for _, imageID := range imageIDs {
		unique[imageID] = struct{}{}
	}
	return len(unique)
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
			if err := tx.First(&coverPic, "image_id = ? AND owner_id = ?", *req.CoverPic, userID.(uuid.UUID)).Error; err == nil {
				if err := tx.Model(&newLocation).Association("CoverPic").Replace(&coverPic); err != nil {
					return err
				}
			} else {
				missingCount++
			}
		}
		// Associate BioPics
		if req.BioPics != nil && len(*req.BioPics) > 0 {
			var bioPics []model.Image
			if err := tx.Where("image_id IN ? AND owner_id = ?", *req.BioPics, userID.(uuid.UUID)).Find(&bioPics).Error; err != nil {
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
