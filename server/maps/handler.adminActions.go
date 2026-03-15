package maps

import (
	"compass/assets"
	"compass/connections"
	"compass/model"
	//"compass/workers"
	//"encoding/json"
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
	 	connections.MQChannel.Publish(
			"",
			viper.GetString("rabbitmq.mailqueue"), // queue name
	 		false,                                 // mandatory
	 		false,                                 // immediate
	 		amqp.Publishing{
	 			ContentType: "application/json",
	 			Body:        []byte(`{"userId": "` + review.User.UserID.String() + `", "message": "` + req.Message + `"}`),
	 		},
	 	)
	 	c.JSON(200, gin.H{"message": "Review rejected", "details": req.Message})
	 	return
	 }
}

func updateLocation(c *gin.Context) {
	locationID := c.Param("id")

	type UpdateLocationRequest struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
		Tag         string `json:"tag"`
		Time        string `json:"time"`
		Contact     string `json:"contact"`
	}

	var req UpdateLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	var loc model.Location
	if err := connections.DB.Where("location_id = ?", locationID).First(&loc).Error; err != nil {
		c.JSON(404, gin.H{"error": "Location not found"})
		return
	}

	// Update editable fields
	loc.Name = req.Name
	loc.Description = req.Description
	loc.Tag = req.Tag
	loc.Time = req.Time
	loc.Contact = req.Contact

	if err := connections.DB.Save(&loc).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to update location"})
		return
	}

	c.JSON(200, gin.H{"message": "Location updated"})
}

func locationAction(c *gin.Context) {
	locationID := c.Param("id")

	var req RequestAddLocation
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	var loc model.Location
	if err := connections.DB.Where("location_id = ?", locationID).First(&loc).Error; err != nil {
		c.JSON(404, gin.H{"error": "Location request not found"})
		return
	}

	// Only allow pending requests to be moderated
	if loc.Status != model.Pending {
		c.JSON(400, gin.H{"error": "Location request is not pending"})
		return
	}

	if req.Status == "approved" {
		loc.Status = model.Approved
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

		c.JSON(200, gin.H{"message": "Location approved"})
		return
	}

	if req.Status == "rejected" {
		if req.Message == "" {
			c.JSON(400, gin.H{"error": "Rejection message required"})
			return
		}

		loc.Status = model.Rejected
		if err := connections.DB.Save(&loc).Error; err != nil {
			c.JSON(500, gin.H{"error": "Failed to reject location"})
			return
		}

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
		//p := bluemonday.UGCPolicy() // User-Generated Content policy
		//for i := range noticeList {
		//noticeList[i].Description = p.Sanitize(noticeList[i].Description)
		//}
		//This is for XSS protection
		//p := bluemonday.UGCPolicy()
		//for i := range notices {
		//notices[i].Description = p.Sanitize(notices[i].Description)
		//}
		// Image exist in the request
		//TODO: Security analysis, if somehow i know what is the uploded image id, then i can steal the image for the user.
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
