package auth

import (
	"compass/assets"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

// FetchAndSaveProfileImage tries to fetch a profile picture from external sources (Site or Home)
// and saves it to the local assets directory. Returns the relative path or empty string.
func FetchAndSaveProfileImage(rollNo, email string, userID uuid.UUID) (string, error) {
	// Extract UserName
	// Assuming email is like 'user@iitk.ac.in'
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		logrus.Warnf("FetchAndSaveProfileImage: Invalid email format: %s", email)
		return "", nil
	}
	userName := parts[0]

	logrus.Infof("FetchAndSaveProfileImage: Attempting for user=%s, rollNo=%s", userName, rollNo)

	// Try Home second
	homeUrlTemplate := viper.GetString("profile.home_url")
	if homeUrlTemplate != "" {
		url := fmt.Sprintf(homeUrlTemplate, userName)
		logrus.Infof("FetchAndSaveProfileImage: Trying Home URL for %s", rollNo)
		relPath, err := downloadAndSave(url, userID)
		if err == nil && relPath != "" {
			logrus.Infof("FetchAndSaveProfileImage: Success from Home")
			return relPath, nil
		} else {
			logrus.Infof("FetchAndSaveProfileImage: Failed Home (err=%v)", err)
		}
	}

	// Internal network restriction, hence no need.
	// Try Site first
	// siteUrlTemplate := viper.GetString("profile.site_url")	

	// if siteUrlTemplate != "" {
	// 	url := fmt.Sprintf(siteUrlTemplate, rollNo)
	// 	logrus.Infof("FetchAndSaveProfileImage: Trying Site URL for %s", rollNo)
	// 	relPath, err := downloadAndSave(url, userID)
	// 	if err == nil && relPath != "" {
	// 		logrus.Infof("FetchAndSaveProfileImage: Success from Site")
	// 		return relPath, nil
	// 	} else {
	// 		logrus.Infof("FetchAndSaveProfileImage: Failed Site (err=%v)", err)
	// 	}
	// }	

	logrus.Warn("FetchAndSaveProfileImage: No image found from any source")
	return "", nil
}

func downloadAndSave(url string, userID uuid.UUID) (string, error) {
	resp, err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("status code %d", resp.StatusCode)
	}

	contentType := resp.Header.Get("Content-Type")
	if !strings.HasPrefix(contentType, "image/") {
		return "", fmt.Errorf("invalid content type: %s", contentType)
	}

	// Read body to bytes
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	// Process image (Compress/Convert)
	processedImage, err := assets.ProcessImageBytes(bodyBytes)
	if err != nil {
		return "", fmt.Errorf("failed to process image: %w", err)
	}

	// Create file path
	cwd, _ := os.Getwd()
	uploadDir := filepath.Join(cwd, "assets", "pfp")

	// Save using assets.SaveImage (which forces .webp extension)
	savePath, err := assets.SaveImage(processedImage, uploadDir, userID)
	if err != nil {
		return "", err
	}

	// Return relative path
	// assets.SaveImage returns full path, we need relative path from "pfp/..."
	return filepath.Join("pfp", filepath.Base(savePath)), nil
}
