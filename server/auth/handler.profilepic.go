package auth

import (
	"compass/connections"
	"compass/model"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// FIXME: When the pfp already exists for the user, need to delete it or update it for the same uuid
// TODO: Define a file limit, and compress it.
func UploadProfileImage(c *gin.Context) {
	userIDRaw, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDRaw.(uuid.UUID)

	// Parsing form
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	file, header, err := c.Request.FormFile("profileImage")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Profile image is required"})
		return
	}
	defer file.Close()

	// Giving absolute folder path
	cwd, _ := os.Getwd() // absolute/path/to/compass/server
	// uploadDir := filepath.Join(cwd, "public", "pfp")
	uploadDir := filepath.Join(cwd, "assets", "pfp")

	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	// Creating file
	ext := filepath.Ext(header.Filename)
	filename := uuid.New().String() + ext
	fullPath := filepath.Join(uploadDir, filename)

	out, err := os.Create(fullPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write file"})
		return
	}

	// Path that frontend uses - > relative
	relativePath := filepath.Join("pfp", filename)

	// TODO: If here any error occurs the image is saved, but no data about it.
	// Saving relative path to DB
	if err := connections.DB.Model(&model.User{}).
		Where("user_id = ?", userID).
		Update("profile_pic", relativePath).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile pic"})
		return
	}

	// fmt.Println("Upload path:", fullPath)

	c.JSON(http.StatusOK, gin.H{
		"message":   "Profile image uploaded successfully",
		"imagePath": relativePath, // return relative path like pfp/36749aa0-c081-48b6-b460-f8b1ee438d7d.jpg
	})
}
