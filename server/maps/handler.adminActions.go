package maps

import (
	"github.com/gin-gonic/gin"
	"compass/model"
	"compass/connections"
	"github.com/spf13/viper"
	amqp "github.com/rabbitmq/amqp091-go"
	// rabbitmq "github.com/rabbitmq/amqp091-go"
)

func flagAction(c *gin.Context) {
	// add the request model to the request.model.go file

	// allow the admin to take the actions like approve, reject

	// if the review is rejected, then add the mail in the mail queue to notify the user add a warning to the user model and add one to that

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation

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
}
