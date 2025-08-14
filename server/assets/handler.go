package assets

import (
	"compass/connections"
	"compass/model"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
	// Compress and convert the image to webp
	if img, err := cncImage(file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in compressing the image"})
	} else if path, err := saveImage(img, "assets/tmp", image.ImageID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in saving image"})
	} else if err := connections.DB.Model(&model.Image{}).Create(&image).Error; err != nil {
		// Add entry in the table and save the image in the server
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error adding image to server"})
		// Delete the image
		deleteImage(path)
		return
	} else {
		// TODO: Pass the image for moderation
		// respond with the id
		c.JSON(http.StatusOK, gin.H{"ImageID": image.ImageID})
	}

}
