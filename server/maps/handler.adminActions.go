package maps

import (
	"compass/connections"
	"compass/model"
	"compass/workers"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

func requestedNoticeImageIDs(input AddNoticeRequest) []uuid.UUID {
	seen := make(map[uuid.UUID]struct{})
	ids := make([]uuid.UUID, 0)
	appendID := func(id uuid.UUID) {
		if id == uuid.Nil {
			return
		}
		if _, exists := seen[id]; exists {
			return
		}
		seen[id] = struct{}{}
		ids = append(ids, id)
	}

	if input.CoverPic != nil {
		appendID(*input.CoverPic)
	}
	if input.BioPics != nil {
		for _, id := range *input.BioPics {
			appendID(id)
		}
	}

	return ids
}

func attachNoticeImages(
	tx *gorm.DB,
	noticeID uuid.UUID,
	ownerID uuid.UUID,
	imageIDs []uuid.UUID,
) error {
	for _, imageID := range imageIDs {
		var image model.Image
		if err := tx.Where("image_id = ?", imageID).First(&image).Error; err != nil {
			return fmt.Errorf("image %s was not found", imageID)
		}

		if image.ParentAssetID == noticeID && image.ParentAssetType == "notices" {
			continue
		}
		if image.OwnerID != ownerID {
			return fmt.Errorf("image %s is not owned by the current user", imageID)
		}
		if image.ParentAssetID != uuid.Nil || image.ParentAssetType != "" {
			return fmt.Errorf("image %s is already attached", imageID)
		}

		if err := tx.Model(&model.Image{}).
			Where("image_id = ?", imageID).
			Updates(map[string]interface{}{
				"parent_asset_id":   noticeID,
				"parent_asset_type": "notices",
				"submitted":         true,
				"status":            model.Approved,
			}).Error; err != nil {
			return err
		}
		if err := workers.MoveImageFromTmpToPublic(imageID); err != nil {
			return err
		}
	}

	return nil
}

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

		job := workers.MailJob{
			Type: "violation_warning",
			To:   user.Email,
			Data: map[string]interface{}{
				"username": user.Profile.Name, // or some other name
				"reason":   req.Message,
			},
		}
		payload, err := json.Marshal(job)
		if err != nil {
			logrus.WithError(err).Error("Failed to marshal violation warning mail job")
		} else if err := workers.PublishJob(payload, model.MailQueue); err != nil {
			logrus.Error("Failed to enqueue mail job:", err)
		}
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
		var contributor model.User
		if err := connections.DB.Where("user_id = ?", loc.ContributedBy).First(&contributor).Error; err != nil {
			logrus.Error("Failed to fetch user for email notification:", err)
		} else {
			job := workers.MailJob{
				Type: "generic_notice",
				To:   contributor.Email,
				Data: map[string]interface{}{
					"message": "Thanks for contributing a location! It's now live.",
				},
			}
			payload, err := json.Marshal(job)
			if err != nil {
				logrus.WithError(err).Error("Failed to marshal location approval mail job")
			} else if err := workers.PublishJob(payload, model.MailQueue); err != nil {
				logrus.Error("Failed to enqueue mail job:", err)
			}
		}

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
		var contributor model.User
		if err := connections.DB.Where("user_id = ?", loc.ContributedBy).First(&contributor).Error; err != nil {
			logrus.Error("Failed to fetch user for email notification:", err)
		} else {
			job := workers.MailJob{
				Type: "generic_notice",
				To:   contributor.Email,
				Data: map[string]interface{}{
					"message": req.Message,
				},
			}
			payload, err := json.Marshal(job)
			if err != nil {
				logrus.WithError(err).Error("Failed to marshal location rejection mail job")
			} else if err := workers.PublishJob(payload, model.MailQueue); err != nil {
				logrus.Error("Failed to enqueue mail job:", err)
			}
		}

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

	if !EventTimesValid(input.EventTime, input.EventEndTime) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event end time cannot be before start time"})
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
		return attachNoticeImages(
			tx,
			notice.NoticeId,
			userID.(uuid.UUID),
			requestedNoticeImageIDs(input),
		)
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

	payload, err := json.Marshal(job)
	if err != nil {
		logrus.WithError(err).Error("Failed to marshal admin promotion mail job")
	} else if err := workers.PublishJob(payload, model.MailQueue); err != nil {
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

	var images []model.Image
	if err := connections.DB.
		Where("parent_asset_id = ? AND parent_asset_type = ?", noticeID, "notices").
		Find(&images).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notice images"})
		return
	}

	if err := connections.DB.Transaction(func(tx *gorm.DB) error {
		if len(images) > 0 {
			if err := tx.Delete(&images).Error; err != nil {
				return err
			}
		}
		return tx.Delete(&notice).Error
	}); err != nil {
		logrus.WithError(err).Error("Failed to delete notice")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete notice"})
		return
	}

	for _, image := range images {
		if err := workers.DeleteImageFiles(image.ImageID); err != nil {
			logrus.WithError(err).Warn("Failed to delete notice image file")
		}
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

	var input AddNoticeRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		logrus.WithError(err).Warn("JSON binding failed")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	if !EventTimesValid(input.EventTime, input.EventEndTime) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event end time cannot be before start time"})
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

	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDValue.(uuid.UUID)
	requestedIDs := requestedNoticeImageIDs(input)
	syncImages := input.CoverPic != nil || input.BioPics != nil
	removedImages := make([]model.Image, 0)

	if err := connections.DB.Transaction(func(tx *gorm.DB) error {
		notice.Title = input.Title
		notice.Description = input.Description
		notice.Entity = input.Entity
		notice.EventTime = input.EventTime
		notice.EventEndTime = input.EventEndTime
		notice.Body = input.Body
		notice.Location = input.Location

		if err := tx.Save(&notice).Error; err != nil {
			return err
		}
		if !syncImages {
			return nil
		}

		var existing []model.Image
		if err := tx.
			Where("parent_asset_id = ? AND parent_asset_type = ?", noticeID, "notices").
			Find(&existing).Error; err != nil {
			return err
		}

		requested := make(map[uuid.UUID]struct{}, len(requestedIDs))
		for _, id := range requestedIDs {
			requested[id] = struct{}{}
		}
		for _, image := range existing {
			if _, keep := requested[image.ImageID]; !keep {
				removedImages = append(removedImages, image)
			}
		}
		if len(removedImages) > 0 {
			if err := tx.Delete(&removedImages).Error; err != nil {
				return err
			}
		}

		return attachNoticeImages(tx, noticeID, userID, requestedIDs)
	}); err != nil {
		logrus.WithError(err).Error("Failed to update notice")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notice"})
		return
	}

	for _, image := range removedImages {
		if err := workers.DeleteImageFiles(image.ImageID); err != nil {
			logrus.WithError(err).Warn("Failed to delete removed notice image file")
		}
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
