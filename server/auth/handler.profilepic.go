package auth

import (
	"compass/connections"
	"compass/model"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

// FIXME: When the pfp already exists for the user, need to delete it or update it for the same uuid
func UploadProfileImage(c *gin.Context) {
	userIDRaw, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDRaw.(uuid.UUID)

	// Fetch old profile pic
	var user model.User
	var oldProfilePic string
	if err := connections.DB.Select("profile_pic").First(&user, "user_id = ?", userID).Error; err == nil {
		oldProfilePic = user.ProfilePic
	}

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
	var filename string

	// Check if we can reuse the existing filename
	if oldProfilePic != "" && strings.HasPrefix(oldProfilePic, "pfp/") {
		// oldProfilePic is like "pfp/UUID.ext"
		base := filepath.Base(oldProfilePic)         // UUID.ext
		oldExt := filepath.Ext(base)                 // .ext
		filenameID := strings.TrimSuffix(base, oldExt) // UUID
		filename = filenameID + ext                  // Reuse UUID with new extension

		// If extension changed, we need to delete the old file immediately to avoid duplicates
		if oldExt != ext {
			oldPath := filepath.Join(cwd, "assets", oldProfilePic)
			if err := os.Remove(oldPath); err != nil {
				logrus.Errorf("Failed to delete old PFP (ext change) at %s: %v", oldPath, err)
			} else {
				logrus.Infof("Deleted old PFP (ext change) at %s", oldPath)
			}
			// Clear oldProfilePic so the cleanup block at the end doesn't try to delete it again
			oldProfilePic = "" 
		} else {
            // If extension is same, os.Create will overwrite, but we should clear oldProfilePic so end block doesn't delete it
            oldProfilePic = ""
        }
	} else {
		filename = uuid.New().String() + ext
	}

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

	// Delete old profile picture if exists
	if oldProfilePic != "" {
		oldPath := filepath.Join(cwd, "assets", oldProfilePic)
		if err := os.Remove(oldPath); err != nil {
			logrus.Errorf("Failed to delete old PFP at %s: %v", oldPath, err)
		} else {
			logrus.Infof("Deleted old PFP at %s", oldPath)
		}
	}

	// fmt.Println("Upload path:", fullPath)

	c.JSON(http.StatusOK, gin.H{
		"message":   "Profile image uploaded successfully",
		"imagePath": relativePath, // return relative path like pfp/36749aa0-c081-48b6-b460-f8b1ee438d7d.jpg
	})
}
