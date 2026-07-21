package maps

import (
	"compass/connections"
	"compass/model"
	"fmt"
	"net/http"
	"strings"
	"time"
	"unicode"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// calendarFeedHandler serves a personalised .ics file for a user.
// GET /api/maps/calendar/:token
func calendarFeedHandler(c *gin.Context) {
	// The Gin param captures everything after /calendar/, including the optional .ics extension.
	raw := c.Param("token")
	token := strings.TrimSuffix(strings.TrimSpace(raw), ".ics")

	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing calendar token"})
		return
	}

	// Look up user by their calendar token
	var user model.User
	if err := connections.DB.
		Where("calendar_token = ?", token).
		First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invalid or expired calendar token"})
			return
		}
		logrus.WithError(err).Error("Failed to look up user by calendar token")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	// Fetch all public Notice events (sorted by event_time ascending)
	var notices []model.Notice
	if err := connections.DB.
		Order("event_time ASC").
		Find(&notices).Error; err != nil {
		logrus.WithError(err).Error("Failed to fetch notices for ICS feed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to build calendar feed"})
		return
	}

	// Fetch the user's personal events (sorted by event_time ascending)
	var userEvents []model.UserEvent
	if err := connections.DB.
		Where("contributed_by = ?", user.UserID).
		Order("event_time ASC").
		Find(&userEvents).Error; err != nil {
		logrus.WithError(err).Error("Failed to fetch user events for ICS feed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to build calendar feed"})
		return
	}

	// Build the .ics file
	c.Header("Content-Type", "text/calendar; charset=utf-8")
	c.Header("Content-Disposition", `attachment; filename="compass-calendar.ics"`)
	// Prevent intermediary caches from serving stale .ics files
	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")

	w := c.Writer

	// iCalendar envelope
	fmt.Fprintf(w, "BEGIN:VCALENDAR\r\n")
	fmt.Fprintf(w, "VERSION:2.0\r\n")
	fmt.Fprintf(w, "PRODID:-//PClub IIT Kanpur//Campus Compass//EN\r\n")
	fmt.Fprintf(w, "CALSCALE:GREGORIAN\r\n")
	fmt.Fprintf(w, "METHOD:PUBLISH\r\n")
	// Hint to calendar clients: refresh every 1 minute (Apple Calendar honours this; Google batches to daily)
	fmt.Fprintf(w, "X-PUBLISHED-TTL:PT1M\r\n")
	fmt.Fprintf(w, "X-WR-CALNAME:Campus Compass – %s\r\n", escapeICSText(user.Email))
	fmt.Fprintf(w, "X-WR-TIMEZONE:Asia/Kolkata\r\n")

	dtstamp := time.Now().UTC().Format("20060102T150405Z")

	// Write Notice events (campus-wide public events)
	for _, notice := range notices {
		uid := fmt.Sprintf("notice-%s@compass.pclub.in", notice.NoticeId.String())
		dtstart := formatICSTime(notice.EventTime)
		dtend := formatICSTime(notice.EventEndTime)

		desc := notice.Description

		// Build a single description string
		descStr := ""
		if desc != "" {
			descStr = "DESCRIPTION:" + foldICSLine(escapeICSText(desc)) + "\r\n"
		}

		locationStr := ""
		if notice.Location != "" {
			locationStr = "LOCATION:" + foldICSLine(escapeICSText(notice.Location)) + "\r\n"
		}

		fmt.Fprintf(w, "BEGIN:VEVENT\r\n")
		fmt.Fprintf(w, "UID:%s\r\n", uid)
		fmt.Fprintf(w, "DTSTAMP:%s\r\n", dtstamp)
		fmt.Fprintf(w, "DTSTART:%s\r\n", dtstart)
		fmt.Fprintf(w, "DTEND:%s\r\n", dtend)
		fmt.Fprintf(w, "SUMMARY:%s\r\n", foldICSLine(escapeICSText(notice.Title)))
		fmt.Fprintf(w, "%s", descStr)
		fmt.Fprintf(w, "%s", locationStr)
		fmt.Fprintf(w, "CATEGORIES:%s\r\n", escapeICSText(notice.Entity))
		fmt.Fprintf(w, "END:VEVENT\r\n")
	}

	// Write personal UserEvent records
	for _, evt := range userEvents {
		uid := fmt.Sprintf("user-event-%s@compass.pclub.in", evt.EventId.String())
		dtstart := formatICSTime(evt.EventTime)
		dtend := formatICSTime(evt.EventEndTime)

		fmt.Fprintf(w, "BEGIN:VEVENT\r\n")
		fmt.Fprintf(w, "UID:%s\r\n", uid)
		fmt.Fprintf(w, "DTSTAMP:%s\r\n", dtstamp)
		fmt.Fprintf(w, "DTSTART:%s\r\n", dtstart)
		fmt.Fprintf(w, "DTEND:%s\r\n", dtend)
		fmt.Fprintf(w, "SUMMARY:%s\r\n", foldICSLine(escapeICSText(evt.Title)))
		fmt.Fprintf(w, "DESCRIPTION:%s\r\n", foldICSLine(escapeICSText(evt.Description)))

		// Emit RRULE for recurring events
		if evt.RecurrenceType == "weekly" {
			if evt.RecurrenceEnd != nil && !evt.RecurrenceEnd.IsZero() {
				until := evt.RecurrenceEnd.UTC().Format("20060102T150405Z")
				fmt.Fprintf(w, "RRULE:FREQ=WEEKLY;UNTIL=%s\r\n", until)
			} else {
				// No end date — repeats forever
				fmt.Fprintf(w, "RRULE:FREQ=WEEKLY\r\n")
			}

			// Emit EXDATE for recurrence exceptions (holidays, breaks)
			if evt.RecurrenceExceptions != "" {
				for _, dateStr := range strings.Split(evt.RecurrenceExceptions, ",") {
					dateStr = strings.TrimSpace(dateStr)
					if dateStr == "" {
						continue
					}
					// Parse YYYY-MM-DD and combine with original event time for EXDATE
					exDate, err := time.Parse("2006-01-02", dateStr)
					if err != nil {
						continue
					}
					exDate = time.Date(exDate.Year(), exDate.Month(), exDate.Day(),
						evt.EventTime.Hour(), evt.EventTime.Minute(), evt.EventTime.Second(), 0, evt.EventTime.Location())
					fmt.Fprintf(w, "EXDATE:%s\r\n", exDate.UTC().Format("20060102T150405Z"))
				}
			}
		}

		fmt.Fprintf(w, "CATEGORIES:Personal\r\n")
		fmt.Fprintf(w, "END:VEVENT\r\n")
	}

	fmt.Fprintf(w, "END:VCALENDAR\r\n")
	c.Status(http.StatusOK)
}

// formatICSTime converts a time.Time to the iCalendar UTC datetime format: 20060102T150405Z
func formatICSTime(t time.Time) string {
	if t.IsZero() {
		return time.Now().UTC().Format("20060102T150405Z")
	}
	return t.UTC().Format("20060102T150405Z")
}

// escapeICSText escapes special characters in iCalendar text values (RFC 5545 §3.3.11).
func escapeICSText(s string) string {
	s = strings.ReplaceAll(s, `\`, `\\`)
	s = strings.ReplaceAll(s, ";", `\;`)
	s = strings.ReplaceAll(s, ",", `\,`)
	s = strings.ReplaceAll(s, "\n", `\n`)
	s = strings.ReplaceAll(s, "\r", "")
	return s
}

// foldICSLine wraps long iCalendar property values at 75 octets per RFC 5545 §3.1.
// Continuation lines begin with a single space.
func foldICSLine(s string) string {
	const maxLen = 75
	if len(s) <= maxLen {
		return s
	}

	var sb strings.Builder
	lineLen := 0
	for _, r := range s {
		charLen := len(string(r))
		if lineLen+charLen > maxLen {
			sb.WriteString("\r\n ")
			lineLen = 1 // leading space counts
		}
		sb.WriteRune(r)
		if unicode.IsControl(r) {
			lineLen = 0
		} else {
			lineLen += charLen
		}
	}
	return sb.String()
}
