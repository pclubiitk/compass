package maps

import (
	"compass/connections"
	"compass/model"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
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
				Body:        []byte(`{"userId": "` + review.User.UserID + `", "message": "` + req.Message + `"}`),
			},
		)
		c.JSON(200, gin.H{"message": "Review rejected", "details": req.Message})
		return
	}
}

func locationAction(c *gin.Context) {
	// add the request model to the request.model.go file

	locationID := c.Param("id")

	var req RequestAddLocation
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	var loc RequestAddLocation
	if err := connections.DB.Model(&RequestAddLocation{}).Where("id = ?", locationID).First(&loc).Error; err != nil {
		c.JSON(404, gin.H{"error": "Location request not found"})
		return
	}

	// add the location in the database if user approve it, else reject it
	if req.Status == "approved" {
		// Insert into final Location table (assuming model.Location exists)
		final := model.Location{
			Name:         loc.Title,
			Latitude:      loc.Latitude,
			Longitude:     loc.Longitude,
			// LocationType:  loc.LocationType, // no locationType in Location
			ContributedBy: loc.Contributor_id,
			Description:   loc.Description,
			// Image:         loc.Image, // no field for image in Location
			Status: 	   "approved", //loc.status giving type error
		}
		if err := connections.DB.Create(&final).Error; err != nil {
			c.JSON(500, gin.H{"error": "Failed to add location"})
			return
		}

		loc.Status = "approved" // approving in og req table
		connections.DB.Save(&loc)

		// Send mail thanking contributor
		connections.MQChannel.Publish(
			"",
			viper.GetString("rabbitmq.mailqueue"),
			false,
			false,
			amqp.Publishing{
				ContentType: "application/json",
				Body:        []byte(`{"userId": "` + loc.Contributor_id + `", "message": "Thanks for contributing a location! It's now live."}`),
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

		loc.Status = "rejected"
		connections.DB.Save(&loc)

		// Send rejection mail
		connections.MQChannel.Publish(
			"",
			viper.GetString("rabbitmq.mailqueue"),
			false,
			false,
			amqp.Publishing{
				ContentType: "application/json",
				Body:        []byte(`{"userId": "` + loc.Contributor_id + `", "message": "` + req.Message + `"}`),
			},
		)

		c.JSON(200, gin.H{"message": "Location rejected", "details": req.Message})
		return
	}
//done
	c.JSON(400, gin.H{"error": "Invalid action"})

	// in both the cases notify the user with a mail, either thanking for contribution or saying sorry

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation
}

func addNotice(c *gin.Context) {
	// add the request model to the request.model.go file

	// add the notice in the database

	// publish a mail confirming notice published

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation
	var input AddNotice

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	userID, err := c.Cookie("user_id")
	if err != nil {
		c.JSON(401, gin.H{"error": "Unauthorized - no session cookie"})
		return
	}

	notice := model.Notice{
		NoticeId:      uuid.NewString(), // generates a UUID string like "f47ac10b-58cc-4372-a567-0e02b2c3d479"
		Title:         input.Title,
		Description:   input.Description,
		Preview:       input.Preview,
		ContributedBy: userID, // user.UserID value
	}

	if err := connections.DB.Create(&notice).Error; err != nil {
		logrus.Fatal("Failed to create notice:", err)
	}

	c.JSON(201, gin.H{"message": "New notice added successfully", "notice": notice})
}
