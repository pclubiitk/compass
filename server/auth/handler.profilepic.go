package auth

import (
	"compass/assets"
	"compass/connections"
	"compass/model"
	"errors"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func UploadProfileImage(c *gin.Context) {
	userIDRaw, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDRaw.(uuid.UUID)

	// MaxBytesReader is applied to the whole server before multipart parsing.
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		var maxBytesErr *http.MaxBytesError
		if errors.As(err, &maxBytesErr) {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "Profile image request is too large"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": "New Failed to parse form"})
		return
	}

	_, header, err := c.Request.FormFile("profileImage")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Profile image is required"})
		return
	}
	if err := assets.ValidateImageSize(header.Size); err != nil {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "Profile image must be less than 10 MB"})
		return
	}

	// Compress and convert to WebP using assets utility
	processedImage, err := assets.CncImage(header)
	if err != nil {
		if errors.Is(err, assets.ErrImageTooLarge) || errors.Is(err, assets.ErrImageDimensionsExceeded) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Profile image exceeds upload limits"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process image"})
		return
	}

	// Setup upload directory
	cwd, _ := os.Getwd()
	_, err = assets.SaveImage(processedImage, filepath.Join(cwd, "assets", "pfp"), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
		return
	}

	// Update the user proflie in the database
	if err := connections.DB.Model(&model.User{}).Where("user_id = ?", userID).Update("profile_pic", true).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile image uploaded successfully",
	})
}
