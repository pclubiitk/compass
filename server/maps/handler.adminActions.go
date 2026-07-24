package maps

import (
	"compass/connections"
	"compass/model"
	"compass/workers"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
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
	if err := connections.DB.Preload("Images").Where("review_id = ?", reviewID).First(&review).Error; err != nil {
		c.JSON(404, gin.H{"error": "Review not found"})
		return
	}

	if req.Action == "approved" {
		// Approve the text and update location score
		if _, err := workers.ApproveReviewRecord(review.ReviewId); err != nil {
			c.JSON(500, gin.H{"error": "Failed to approve review text"})
			return
		}
		// Handle the images
		for _, img := range review.Images {
			imgID := img.ImageID

			// Mark the image as approved in the database
			if err := connections.DB.Model(&model.Image{}).
				Where("image_id = ?", imgID).
				Update("status", "approved").Error; err != nil {
				logrus.Errorf("Failed to update status for image %s: %v", imgID, err)
			}

			// Move the file from /tmp to /public so React can render it
			if err := workers.MoveImageFromTmpToPublic(imgID); err != nil {
				logrus.Errorf("Admin approved, but failed to move image %s to public folder: %v", imgID, err)
			}
		}

		c.JSON(200, gin.H{"message": "Review and associated images approved"})
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
		if err := connections.DB.Where("user_id = ?", review.ContributedBy).First(&user).Error; err != nil {
			logrus.Errorf("Failed to find user for review rejection email: %v", err)
			c.JSON(200, gin.H{"message": "Review rejected", "details": req.Message})
			return
		}

		connections.MQChannel.Publish(
			"",
			viper.GetString("rabbitmq.mailqueue"),
			false,
			false,
			amqp.Publishing{
				ContentType: "application/json",
				Body:        []byte(`{"userId": "` + user.UserID.String() + `", "message": "` + req.Message + `"}`),
			},
		)
		c.JSON(200, gin.H{"message": "Review rejected", "details": req.Message})
		return
	}
}

func LocationAction(c *gin.Context) {
	// add the request model to the request.model.go file

	locationID := c.Param("id")

	var req struct {
		Status  string `json:"status"`
		Message string `json:"message"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	var loc model.Location
	if err := connections.DB.Where("location_id = ?", locationID).First(&loc).Error; err != nil {
		c.JSON(404, gin.H{"error": "Location request not found"})
		return
	}

	// add the location in the database if admin approve it, else reject it
	if req.Status == "approved" {
		// Just update the status, location already exists in the table
		loc.Status = model.Status("approved")
		if err := connections.DB.Save(&loc).Error; err != nil {
			c.JSON(500, gin.H{"error": "Failed to approve location"})
			return
		}

		// Send mail thanking contributor
		connections.MQChannel.Publish(
			"",
			viper.GetString("rabbitmq.mailqueue"),
			false,
			false,
			amqp.Publishing{
				ContentType: "application/json",
				Body:        []byte(`{"userId": "` + loc.ContributedBy.String() + `", "message": "Thanks for contributing a location! It's now live."}`),
			},
		)

		c.JSON(200, gin.H{"message": "Location approved and added"})
		return
	}

	if req.Status == "rejected" {
		if req.Message == "" {
			c.JSON(400, gin.H{"error": "Rejection message required"})
			return
		}

		loc.Status = model.Status("rejected")
		if err := connections.DB.Save(&loc).Error; err != nil {
			c.JSON(500, gin.H{"error": "Failed to reject location"})
			return
		}

		// Send rejection mail
		connections.MQChannel.Publish(
			"",
			viper.GetString("rabbitmq.mailqueue"),
			false,
			false,
			amqp.Publishing{
				ContentType: "application/json",
				Body:        []byte(`{"userId": "` + loc.ContributedBy.String() + `", "message": "` + req.Message + `"}`),
			},
		)

		c.JSON(200, gin.H{"message": "Location rejected", "details": req.Message})
		return
	}
	c.JSON(400, gin.H{"error": "Invalid action"})

	// in both the cases notify the user with a mail, either thanking for contribution or saying sorry

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation
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
			if err := workers.MoveImageFromTmpToPublic(*input.CoverPic); err != nil {
				return err
			}
		}

		if input.BioPics != nil && len(*input.BioPics) > 0 {
			if err := tx.Model(&model.Image{}).
				Where("image_id IN ?", *input.BioPics).
				Updates(map[string]interface{}{
					"ParentAssetID":   notice.NoticeId,
					"ParentAssetType": "notices",
					"Submitted":       true,
					"Status":          "approved",
				}).Error; err != nil {
				return err
			}
			for _, imgID := range *input.BioPics {
				if err := workers.MoveImageFromTmpToPublic(imgID); err != nil {
					return err
				}
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

type MakeAdminRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// Promote user to Admin (SuperAdmin only)
func makeAdminHandler(c *gin.Context) {
	// Check role from middleware
	userRole, exists := c.Get("userRole")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	role, ok := userRole.(int)
	if !ok || role != int(model.SuperAdminRole) {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Only super admins can promote users to admin",
		})
		return
	}

	var req MakeAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	var user model.User
	err := connections.DB.
		Where("email = ?", req.Email).
		Preload("Profile").
		First(&user).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		logrus.WithError(err).Error("Database error fetching user")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Already admin check
	if user.Role == model.AdminRole || user.Role == model.SuperAdminRole {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "User is already an admin or super admin",
		})
		return
	}

	// Update role
	if err := connections.DB.Model(&user).
		Update("role", model.AdminRole).Error; err != nil {
		logrus.WithError(err).Error("Failed to update user role")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to promote user"})
		return
	}

	job := workers.MailJob{
		Type: "make_admin",
		To:   user.Email,
		Data: map[string]interface{}{
			"name": user.Profile.Name,
		},
	}

	payload, _ := json.Marshal(job)
	if err := workers.PublishJob(payload, model.MailQueue); err != nil {
		logrus.WithError(err).Error("Failed to enqueue admin promotion email")
		// Don't fail the request if email fails to enqueue
	}

	//  Do we really need to mail the user regarding promotion??
	// Todo : publish a mail confirming promotion
	c.JSON(http.StatusOK, gin.H{
		"message": "User promoted to admin successfully",
		"email":   user.Email,
		"name":    user.Profile.Name,
		"role":    model.AdminRole,
	})
}

type DemoteAdminRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// Demote admin back to normal user (SuperAdmin only)
func demoteAdminHandler(c *gin.Context) {
	userRole, exists := c.Get("userRole")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	role, ok := userRole.(int)
	if !ok || role != int(model.SuperAdminRole) {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Only super admins can demote admins",
		})
		return
	}

	var req DemoteAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	var user model.User
	err := connections.DB.Where("email = ?", req.Email).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Prevent demoting super admin (optional safety)
	if user.Role == model.SuperAdminRole {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Cannot demote a super admin",
		})
		return
	}

	// Change role back to normal user
	if err := connections.DB.Model(&user).
		Update("role", model.UserRole).Error; err != nil {
		logrus.WithError(err).Error("Failed to demote admin")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to demote admin"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Admin demoted to user successfully",
		"email":   user.Email,
		"role":    model.UserRole,
	})
}

func deleteNotice(c *gin.Context) {

	// P\parse and validate UUID
	noticeIDStr := c.Param("id")
	noticeID, err := uuid.Parse(noticeIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notice ID format"})
		return
	}

	// find the notice
	var notice model.Notice
	if err := connections.DB.Where("notice_id = ?", noticeID).First(&notice).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Notice not found"})
			return
		}
		logrus.WithError(err).Error("Failed to fetch notice")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notice"})
		return
	}

	// soft delete (sets deleted_at timestamp)
	if err := connections.DB.Delete(&notice).Error; err != nil {
		logrus.WithError(err).Error("Failed to delete notice")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete notice"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Notice deleted successfully",
		"notice_id": noticeID,
	})
}

func editNotice(c *gin.Context) {

	noticeIDStr := c.Param("id")
	noticeID, err := uuid.Parse(noticeIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notice ID format"})
		return
	}

	var input model.Notice
	if err := c.ShouldBindJSON(&input); err != nil {
		logrus.WithError(err).Warn("JSON binding failed")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	var notice model.Notice
	if err := connections.DB.Where("notice_id = ?", noticeID).First(&notice).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Notice not found"})
			return
		}
		logrus.WithError(err).Error("Failed to fetch notice")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notice"})
		return
	}

	notice.Title = input.Title
	notice.Description = input.Description
	notice.Entity = input.Entity
	notice.EventTime = input.EventTime
	notice.EventEndTime = input.EventEndTime
	notice.Body = input.Body
	notice.Location = input.Location

	if err := connections.DB.Save(&notice).Error; err != nil {
		logrus.WithError(err).Error("Failed to update notice")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notice"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Notice updated successfully",
		"notice_id": noticeID,
	})
}

func editLocation(c *gin.Context) {
	locationIDStr := c.Param("id")
	locationID, err := uuid.Parse(locationIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid location ID format"})
		return
	}

	var input EditLocationRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		logrus.WithError(err).Warn("JSON binding failed")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	var loc model.Location
	if err := connections.DB.Where("location_id = ?", locationID).First(&loc).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Location not found"})
			return
		}
		logrus.WithError(err).Error("Failed to fetch location")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch location"})
		return
	}

	loc.Name = input.Name
	loc.Description = input.Description
	loc.Tag = input.Tag
	loc.Time = input.Time
	loc.Contact = input.Contact
	loc.LocationType = input.LocationType
	loc.Layer = int(input.Layer)

	if err := connections.DB.Save(&loc).Error; err != nil {
		logrus.WithError(err).Error("Failed to update location")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update location"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "Location updated successfully",
		"location_id": locationID,
	})
}
