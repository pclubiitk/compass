package maps

import (
	"compass/connections"
	"compass/model"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// getUserEvents returns all personal calendar events for the authenticated user.
// GET /api/maps/user-events
func getUserEvents(c *gin.Context) {
	userID, exist := c.Get("userID")
	if !exist {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var events []model.UserEvent
	if err := connections.DB.
		Where("contributed_by = ?", userID.(uuid.UUID)).
		Order("event_time ASC").
		Find(&events).Error; err != nil {
		logrus.WithError(err).Error("Failed to fetch user events")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch events"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"events": events})
}

// createUserEvent creates a new personal calendar event for the authenticated user.
// POST /api/maps/user-event
func createUserEvent(c *gin.Context) {
	userID, exist := c.Get("userID")
	if !exist {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input AddUserEventRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		logrus.WithError(err).Warn("JSON binding failed for user event")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	color := input.Color
	if color == "" {
		color = "blue"
	}

	event := model.UserEvent{
		Title:         input.Title,
		Description:   input.Description,
		EventTime:     input.EventTime,
		EventEndTime:  input.EventEndTime,
		Color:         color,
		ContributedBy: userID.(uuid.UUID),
	}

	if err := connections.DB.Create(&event).Error; err != nil {
		logrus.WithError(err).Error("Failed to create user event")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create event"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Event created successfully", "event": event})
}

// updateUserEvent updates a personal calendar event.
// Only the owner of the event can update it.
// PUT /api/maps/user-event/:id
func updateUserEvent(c *gin.Context) {
	userID, exist := c.Get("userID")
	if !exist {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	eventIDStr := c.Param("id")
	eventID, err := uuid.Parse(eventIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID format"})
		return
	}

	var event model.UserEvent
	if err := connections.DB.Where("event_id = ?", eventID).First(&event).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
			return
		}
		logrus.WithError(err).Error("Failed to fetch user event")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch event"})
		return
	}

	// Ownership check — only the creator can edit
	if event.ContributedBy != userID.(uuid.UUID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You do not have permission to edit this event"})
		return
	}

	var input AddUserEventRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		logrus.WithError(err).Warn("JSON binding failed for user event update")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	event.Title = input.Title
	event.Description = input.Description
	event.EventTime = input.EventTime
	event.EventEndTime = input.EventEndTime
	if input.Color != "" {
		event.Color = input.Color
	}

	if err := connections.DB.Save(&event).Error; err != nil {
		logrus.WithError(err).Error("Failed to update user event")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update event"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Event updated successfully", "event": event})
}

// deleteUserEvent deletes a personal calendar event.
// Only the owner of the event can delete it.
// DELETE /api/maps/user-event/:id
func deleteUserEvent(c *gin.Context) {
	userID, exist := c.Get("userID")
	if !exist {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	eventIDStr := c.Param("id")
	eventID, err := uuid.Parse(eventIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID format"})
		return
	}

	var event model.UserEvent
	if err := connections.DB.Where("event_id = ?", eventID).First(&event).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
			return
		}
		logrus.WithError(err).Error("Failed to fetch user event for deletion")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch event"})
		return
	}

	// Ownership check — only the creator can delete
	if event.ContributedBy != userID.(uuid.UUID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You do not have permission to delete this event"})
		return
	}

	if err := connections.DB.Delete(&event).Error; err != nil {
		logrus.WithError(err).Error("Failed to delete user event")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete event"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Event deleted successfully", "event_id": eventID})
}
