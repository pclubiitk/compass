package maps

import (
	"compass/connections"
	"compass/model"
	"errors"
	"net/http"
	"strings"
	"time"

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

	if !input.EventEndTime.IsZero() && input.EventEndTime.Before(input.EventTime) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event end time cannot be before start time"})
		return
	}

	color := input.Color
	if color == "" {
		color = "blue"
	}

	recType := input.RecurrenceType
	if recType != "weekly" {
		recType = ""
	}

	event := model.UserEvent{
		Title:                input.Title,
		Description:          input.Description,
		EventTime:            input.EventTime,
		EventEndTime:         input.EventEndTime,
		Color:                color,
		RecurrenceType:       recType,
		RecurrenceEnd:        input.RecurrenceEnd,
		RecurrenceExceptions: strings.Join(input.RecurrenceExceptions, ","),
		ContributedBy:        userID.(uuid.UUID),
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

	if !input.EventEndTime.IsZero() && input.EventEndTime.Before(input.EventTime) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event end time cannot be before start time"})
		return
	}

	event.Title = input.Title
	event.Description = input.Description
	event.EventTime = input.EventTime
	event.EventEndTime = input.EventEndTime
	if input.Color != "" {
		event.Color = input.Color
	}

	// Update recurrence fields
	recType := input.RecurrenceType
	if recType != "weekly" {
		recType = ""
	}
	event.RecurrenceType = recType
	event.RecurrenceEnd = input.RecurrenceEnd
	event.RecurrenceExceptions = strings.Join(input.RecurrenceExceptions, ",")

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

// batchCreateUserEvents bulk-creates personal calendar events in a single request.
// Designed for timetable imports — accepts up to 100 events.
// Duplicates (same title + eventTime for the same user) are silently skipped.
// POST /api/maps/user-events/batch
func batchCreateUserEvents(c *gin.Context) {
	userID, exist := c.Get("userID")
	if !exist {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	uid := userID.(uuid.UUID)

	var input BatchAddUserEventsRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		logrus.WithError(err).Warn("JSON binding failed for batch user events")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Delete existing imported class events for the user so we start fresh
	if err := connections.DB.
		Where("contributed_by = ? AND (title ILIKE 'Lec-%' OR title ILIKE 'Tut-%' OR title ILIKE 'Prc-%')", uid).
		Delete(&model.UserEvent{}).Error; err != nil {
		logrus.WithError(err).Error("Failed to delete existing class events")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear old timetable"})
		return
	}

	existingSet := make(map[string]bool)

	var toCreate []model.UserEvent
	skipped := 0
	for _, e := range input.Events {
		key := e.Title + "|" + e.EventTime.UTC().Format(time.RFC3339)
		if existingSet[key] {
			skipped++
			continue
		}

		color := e.Color
		if color == "" {
			color = "green"
		}
		recType := e.RecurrenceType
		if recType != "weekly" {
			recType = ""
		}

		toCreate = append(toCreate, model.UserEvent{
			Title:                e.Title,
			Description:          e.Description,
			EventTime:            e.EventTime,
			EventEndTime:         e.EventEndTime,
			Color:                color,
			RecurrenceType:       recType,
			RecurrenceEnd:        e.RecurrenceEnd,
			RecurrenceExceptions: strings.Join(e.RecurrenceExceptions, ","),
			ContributedBy:        uid,
		})

		// Also mark as seen to prevent intra-batch duplicates
		existingSet[key] = true
	}

	if len(toCreate) > 0 {
		if err := connections.DB.CreateInBatches(toCreate, 50).Error; err != nil {
			logrus.WithError(err).Error("Failed to batch-create user events")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create events"})
			return
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Events imported successfully",
		"created": len(toCreate),
		"skipped": skipped,
		"events":  toCreate,
	})
}

// deleteAllClassEvents clears all imported class events from the timetable.
// DELETE /api/maps/user-events/classes
func deleteAllClassEvents(c *gin.Context) {
	userID, exist := c.Get("userID")
	if !exist {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	uid := userID.(uuid.UUID)

	res := connections.DB.
		Where("contributed_by = ? AND (title ILIKE 'Lec-%' OR title ILIKE 'Tut-%' OR title ILIKE 'Prc-%')", uid).
		Delete(&model.UserEvent{})
	
	if err := res.Error; err != nil {
		logrus.WithError(err).Error("Failed to delete existing class events")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear old timetable"})
		return
	}

	logrus.Infof("Deleted %d class events for user %s", res.RowsAffected, uid)

	c.JSON(http.StatusOK, gin.H{"message": "Timetable cleared successfully"})
}
