package maps

import (
	"compass/connections"
	"compass/model"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

// getCalendarToken returns the authenticated user's calendar token and their
// ready-to-subscribe webcal:// URL.
// GET /api/maps/calendar/token   (requires auth)
func getCalendarToken(c *gin.Context) {
	userID, exist := c.Get("userID")
	if !exist {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var user model.User
	if err := connections.DB.
		Select("user_id", "email", "calendar_token").
		Where("user_id = ?", userID.(uuid.UUID)).
		First(&user).Error; err != nil {
		logrus.WithError(err).Error("Failed to fetch user for calendar token")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch calendar token"})
		return
	}

	// Lazily initialise the token if it is somehow still empty (should not happen
	// with the DB default, but acts as a safety net).
	if user.CalendarToken == "" {
		newToken := uuid.New().String()
		if err := connections.DB.
			Model(&model.User{}).
			Where("user_id = ?", userID.(uuid.UUID)).
			Update("calendar_token", newToken).Error; err != nil {
			logrus.WithError(err).Error("Failed to initialise calendar token")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initialise calendar token"})
			return
		}
		user.CalendarToken = newToken
	}

	c.JSON(http.StatusOK, gin.H{
		"token":      user.CalendarToken,
		"webcal_url": buildWebcalURL(user.CalendarToken),
		"https_url":  buildHTTPSURL(user.CalendarToken),
	})
}

// regenerateCalendarToken rotates the user's calendar token.
// The old subscription URL will immediately stop working; the user must
// re-subscribe using the new URL returned here.
// POST /api/maps/calendar/token/regenerate   (requires auth)
func regenerateCalendarToken(c *gin.Context) {
	userID, exist := c.Get("userID")
	if !exist {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	newToken := uuid.New().String()

	if err := connections.DB.
		Model(&model.User{}).
		Where("user_id = ?", userID.(uuid.UUID)).
		Update("calendar_token", newToken).Error; err != nil {
		logrus.WithError(err).Error("Failed to regenerate calendar token")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to regenerate calendar token"})
		return
	}

	logrus.WithField("userID", userID).Info("Calendar token regenerated")

	c.JSON(http.StatusOK, gin.H{
		"token":      newToken,
		"webcal_url": buildWebcalURL(newToken),
		"https_url":  buildHTTPSURL(newToken),
		"message":    "Calendar token regenerated. Update your calendar app with the new URL.",
	})
}

func buildWebcalURL(token string) string {
	url := buildHTTPSURL(token)
	// Swap http(s):// prefix for webcal:// so calendar apps treat it as a subscription URL
	switch {
	case strings.HasPrefix(url, "https://"):
		url = "webcal://" + url[len("https://"):]
	case strings.HasPrefix(url, "http://"):
		url = "webcal://" + url[len("http://"):]
	}
	return url
}

func buildHTTPSURL(token string) string {
	env := viper.GetString("env")
	if env != "dev" {
		switch env {
		case "prod":
			frontendURL := viper.GetString("frontend_url")
			return fmt.Sprintf("%s/api/maps/calendar/%s.ics", frontendURL, token)
		case "test":
			return fmt.Sprintf("http://bsearch.pclub.in/api/maps/calendar/%s.ics", token)
		}
	}
	// In dev there is no nginx proxy
	mapsPort := viper.GetString("ports.maps")
	return fmt.Sprintf("http://localhost:%s/api/maps/calendar/%s.ics", mapsPort, token)

}
