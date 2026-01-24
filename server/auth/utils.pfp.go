package auth

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/spf13/viper"
	"github.com/sirupsen/logrus"
)

// FetchAndSaveProfileImage tries to fetch a profile picture from external sources (Site or Home)
// and saves it to the local assets directory. Returns the relative path or empty string.
func FetchAndSaveProfileImage(rollNo, email string) (string, error) {
	// Extract UserName
	// Assuming email is like 'user@iitk.ac.in'
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		logrus.Warnf("FetchAndSaveProfileImage: Invalid email format: %s", email)
		return "", nil
	}
	userName := parts[0]

	logrus.Infof("FetchAndSaveProfileImage: Attempting for user=%s, rollNo=%s", userName, rollNo)

	// Try Site first
	siteUrlTemplate := viper.GetString("profile.site_url")
	if siteUrlTemplate != "" {
		url := fmt.Sprintf(siteUrlTemplate, rollNo)
		logrus.Infof("FetchAndSaveProfileImage: Trying Site URL: %s", url)
		relPath, err := downloadAndSave(url)
		if err == nil && relPath != "" {
			logrus.Infof("FetchAndSaveProfileImage: Success from Site")
			return relPath, nil
		} else {
			logrus.Infof("FetchAndSaveProfileImage: Failed Site (err=%v)", err)
		}
	}

	// Try Home second
	homeUrlTemplate := viper.GetString("profile.home_url")
	if homeUrlTemplate != "" {
		url := fmt.Sprintf(homeUrlTemplate, userName)
		logrus.Infof("FetchAndSaveProfileImage: Trying Home URL: %s", url)
		relPath, err := downloadAndSave(url)
		if err == nil && relPath != "" {
			logrus.Infof("FetchAndSaveProfileImage: Success from Home")
			return relPath, nil
		} else {
			logrus.Infof("FetchAndSaveProfileImage: Failed Home (err=%v)", err)
		}
	}

	logrus.Warn("FetchAndSaveProfileImage: No image found from any source")
	return "", nil
}

func downloadAndSave(url string) (string, error) {
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

	// Determine extension
	ext := ".jpg" // default
	if strings.Contains(contentType, "png") {
		ext = ".png"
	} else if strings.Contains(contentType, "jpeg") {
		ext = ".jpg"
	}

	// Create file path
	cwd, _ := os.Getwd()
	uploadDir := filepath.Join(cwd, "assets", "pfp")
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		return "", err
	}

	filename := uuid.New().String() + ext
	fullPath := filepath.Join(uploadDir, filename)

	out, err := os.Create(fullPath)
	if err != nil {
		return "", err
	}
	defer out.Close()

	if _, err := io.Copy(out, resp.Body); err != nil {
		return "", err
	}

	// Return relative path
	return filepath.Join("pfp", filename), nil
}
