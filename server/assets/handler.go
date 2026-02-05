package assets

import (
	"compass/connections"
	"compass/model"
	"compass/workers"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

func uploadAsset(c *gin.Context) {
	var req ImageUploadRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image is required"})
		return
	}
	userID, exist := c.Get("userID")
	if !exist {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	image := model.Image{
		ImageID:   uuid.New(),
		OwnerID:   userID.(uuid.UUID),
		Status:    model.Pending,
		Submitted: false,
	}
	file := req.File
	cwd, _ := os.Getwd()
	// Compress and convert the image to webp
	if img, err := CncImage(file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in compressing the image"})
	} else if path, err := SaveImage(img, filepath.Join(cwd, "assets", "tmp"), image.ImageID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in saving image"})
	} else if err := connections.DB.Model(&model.Image{}).Create(&image).Error; err != nil {
		// Add entry in the table and save the image in the server
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error adding image to server"})
		// Delete the image
		deleteImage(path)
		return
	} else {
		moderationJob := workers.ModerationJob{
			AssetID: image.ImageID,
			Type:    model.ModerationTypeImage,
		}

		payload, _ := json.Marshal(moderationJob)
		if err := workers.PublishJob(payload, "moderation"); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to queue moderation job"})
			deleteImage(path)
			return
		}
		c.JSON(http.StatusOK, gin.H{"ImageID": image.ImageID})
	}
}

func imageListProvider(c *gin.Context) {
	// Fetch images from database
	var images []model.Image
	if err := connections.DB.
		Model(&model.Image{}).
		Find(&images).Error; err != nil {
		logrus.Errorf("Failed to fetch images: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err})
		return
	}

	c.JSON(200, gin.H{
		"images": images,
	})

}

func imageDetailProvider(c *gin.Context) {
	var image model.Image
	imageIDParam := c.Param("id")
	imageID, err := uuid.Parse(imageIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image ID"})
		return
	}

	if err := connections.DB.
		Model(&model.Image{}).
		Where("image_id = ?", imageID).
		First(&image).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		} else {
			logrus.Errorf("Failed to fetch image: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch image"})
		}
		return
	}

	c.JSON(200, gin.H{
		"image": image,
	})
}

func approveImage(c *gin.Context) {
	var image model.Image
	imageIDParam := c.Param("id")
	imageID, err := uuid.Parse(imageIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image ID"})
		return
	}

	if err := connections.DB.
		Model(&model.Image{}).
		Where("image_id = ?", imageID).
		First(&image).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
			return
		} else {
			logrus.Errorf("Failed to fetch image: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch image"})
		}
		return
	}

	if image.Status == "approved" {
		c.JSON(200, gin.H{"message": "image already approved"})
		return
	}

	image.Status = "approved"
	util_error := MoveImageFromTmpToPublic(imageID)
	if util_error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": util_error})
		return
	}
	savedImage := connections.DB.Save(&image)
	if savedImage.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
		return
	}

	c.JSON(200, gin.H{
		"message": "Image approved",
	})
}

func removeImage(c *gin.Context) {
	var image model.Image
	imageIDParam := c.Param("id")
	imageID, err := uuid.Parse(imageIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image ID"})
		return
	}

	if err := connections.DB.
		Model(&model.Image{}).
		Where("image_id = ?", imageID).
		First(&image).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
			return
		} else {
			logrus.Errorf("Failed to fetch image: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch image"})
		}
		return
	}
	cwd, _ := os.Getwd()
	path := ""
	switch image.Status {
	case "approved":
		path = filepath.Join(cwd, "assets", "public", imageID.String()+".webp")
	case "pending":
		path = filepath.Join(cwd, "assets", "tmp", imageID.String()+".webp")
	}

	util_error := deleteImage(path)
	if util_error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": util_error})
		return
	}
	deletedImage := connections.DB.Delete(&image)
	if deletedImage.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete image"})
		return
	}

	c.JSON(200, gin.H{
		"message": "Image deleted",
	})

}
