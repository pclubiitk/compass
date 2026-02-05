package maps

import (
	"compass/assets"
	"compass/connections"
	"compass/model"
	"compass/workers"
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

func flagAction(c *gin.Context) {

	reviewID := c.Param("id")

	var req FlagActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	var review model.Review
	if err := connections.DB.Where("id = ?", reviewID).First(&review).Error; err != nil {
		c.JSON(404, gin.H{"error": "Review not found"})
		return
	}

	if req.Action == "approved" {

		review.Status = "approved"
		//update ratting of the location
		var location model.Location
		if err := connections.DB.Where("id = ?", review.LocationId).First(&location); err != nil {
			c.JSON(400, gin.H{"error": "error while updating the location review count"})
		}
		location.ReviewCount += 1
		location.AverageRating = ((location.AverageRating * float32(location.ReviewCount-1)) + float32(review.Rating)) / float32(location.ReviewCount)

		if err := connections.DB.Save(&location).Error; err != nil {
			c.JSON(400, gin.H{"error": "error while updating the location review count"})
		}
		c.JSON(200, gin.H{"message": "Review approved"})

		return
	}

	if req.Action == "rejected" {
		if req.Message == "" {
			c.JSON(400, gin.H{"error": "Rejection message required"})
			return
		}

		review.Status = "rejected"
		if err := connections.DB.Save(&review).Error; err != nil {
			c.JSON(500, gin.H{"error": "Failed to update review status"})
			return
		}

		var user model.User
		if err := connections.DB.First(&user, "user_id = ?", review.ContributedBy).Error; err != nil {
			logrus.WithError(err).WithField("userID", review.ContributedBy).Warn("Failed to load contributor for review rejection email")
		} else {
			mailJob := workers.MailJob{
				Type: "generic_notice",
				To:   user.Email,
				Data: map[string]interface{}{
					"message": req.Message,
				},
			}
			payload, err := json.Marshal(mailJob)
			if err != nil {
				logrus.WithError(err).Warn("Failed to marshal review rejection mail job")
			} else if err := workers.PublishJob(payload, model.MailQueue); err != nil {
				logrus.WithError(err).Warn("Failed to queue review rejection email")
			}
		}
		c.JSON(200, gin.H{"message": "Review rejected", "details": req.Message})
		return
	}
}

func locationAction(c *gin.Context) {
	locationID := c.Param("id")
	logrus.WithField("locationID", locationID).Info("Location action request received")

	var req FlagActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.WithError(err).Warn("Invalid request format")
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	logrus.WithFields(logrus.Fields{
		"locationID": locationID,
		"action":     req.Action,
	}).Info("Processing location action")

	var location model.Location
	if err := connections.DB.Where("location_id = ?", locationID).First(&location).Error; err != nil {
		logrus.WithError(err).WithField("locationID", locationID).Warn("Location not found")
		c.JSON(404, gin.H{"error": "Location not found"})
		return
	}

	logrus.WithFields(logrus.Fields{
		"locationID":      locationID,
		"currentStatus":   location.Status,
		"requestedAction": req.Action,
	}).Info("Location found, processing action")

	if req.Action == "approved" {
		// Update using Model and Updates for better control
		if err := connections.DB.Model(&model.Location{}).
			Where("location_id = ?", locationID).
			Update("status", model.Approved).Error; err != nil {
			logrus.WithError(err).Error("Failed to update location status")
			c.JSON(500, gin.H{"error": "Failed to update location status"})
			return
		}

		logrus.WithField("locationID", locationID).Info("Location approved successfully")

		// Send mail thanking contributor
		var user model.User
		if err := connections.DB.First(&user, "user_id = ?", location.ContributedBy).Error; err != nil {
			logrus.WithError(err).WithField("userID", location.ContributedBy).Warn("Failed to load contributor for approval email")
		} else {
			mailJob := workers.MailJob{
				Type: "thanks_contribution",
				To:   user.Email,
				Data: map[string]interface{}{
					"username":      user.Email,
					"content_title": location.Name,
				},
			}
			payload, err := json.Marshal(mailJob)
			if err != nil {
				logrus.WithError(err).Warn("Failed to marshal approval mail job")
			} else if err := workers.PublishJob(payload, model.MailQueue); err != nil {
				logrus.WithError(err).Warn("Failed to queue approval email")
			}
		}

		c.JSON(200, gin.H{"message": "Location approved and added"})
		return
	}

	if req.Action == "rejected" {
		if req.Message == "" {
			c.JSON(400, gin.H{"error": "Rejection message required"})
			return
		}

		// Update using Model and Updates for better control
		if err := connections.DB.Model(&model.Location{}).
			Where("location_id = ?", locationID).
			Update("status", model.Rejected).Error; err != nil {
			logrus.WithError(err).Error("Failed to update location status")
			c.JSON(500, gin.H{"error": "Failed to update location status"})
			return
		}

		logrus.WithField("locationID", locationID).Info("Location rejected successfully")

		// Send rejection mail
		var user model.User
		if err := connections.DB.First(&user, "user_id = ?", location.ContributedBy).Error; err != nil {
			logrus.WithError(err).WithField("userID", location.ContributedBy).Warn("Failed to load contributor for rejection email")
		} else {
			mailJob := workers.MailJob{
				Type: "generic_notice",
				To:   user.Email,
				Data: map[string]interface{}{
					"message": req.Message,
				},
			}
			payload, err := json.Marshal(mailJob)
			if err != nil {
				logrus.WithError(err).Warn("Failed to marshal rejection mail job")
			} else if err := workers.PublishJob(payload, model.MailQueue); err != nil {
				logrus.WithError(err).Warn("Failed to queue rejection email")
			}
		}

		c.JSON(200, gin.H{"message": "Location rejected", "details": req.Message})
		return
	}

	c.JSON(400, gin.H{"error": "Invalid action"})
}

func addNotice(c *gin.Context) {
	var input AddNoticeRequest

	if err := c.ShouldBindJSON(&input); err != nil {
		logrus.WithError(err).Warn("JSON binding failed")

		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	userID, exist := c.Get("userID") // means api requests must be authenticated
	if !exist {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if err := connections.DB.Transaction(func(tx *gorm.DB) error {
		// Create notice
		notice := model.Notice{
			Title:         input.Title,
			Description:   input.Description,
			Entity:        input.Entity,
			EventTime:     input.EventTime,
			EventEndTime:  input.EventEndTime,
			Body:          input.Body,
			Location:      input.Location,
			ContributedBy: userID.(uuid.UUID),
		}
		if err := tx.Create(&notice).Error; err != nil {
			return err
		}
		// TODO: Can do sanitization of the text
		// p := bluemonday.UGCPolicy() // User-Generated Content policy
		// for i := range noticeList {
		// 	noticeList[i].Description = p.Sanitize(noticeList[i].Description)
		// }
		//This is for XSS protection
		// p := bluemonday.UGCPolicy()
		// for i := range notices {
		// 	notices[i].Description = p.Sanitize(notices[i].Description)
		// }
		//  Image exist in the request
		// TODO: Security analysis, if somehow i know what is the uploded image id, then i can steal the image for the user.
		if input.CoverPic != nil {
			// Attach existing image to notice polymorphically
			if err := tx.Model(&model.Image{}).
				Where("image_id = ?", *input.CoverPic).
				Updates(map[string]interface{}{
					"ParentAssetID":   notice.NoticeId,
					"ParentAssetType": "notices",
					"Submitted":       true,
					"Status":          "approved", // As notice is allowed by admin, hence no moderation
				}).Error; err != nil {
				return err
			}
			// Move image from tmp to public
			if err := assets.MoveImageFromTmpToPublic(*input.CoverPic); err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		logrus.Error("Failed to create notice:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// TODO: publish a mail confirming notice published
	c.JSON(201, gin.H{"message": "New notice added successfully"})
}
