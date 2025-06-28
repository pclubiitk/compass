package maps

import (
	"compass/connections"
	"compass/model"

	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
	amqp "github.com/rabbitmq/amqp091-go"
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

	// add the location in the database if user approve it, else reject it

	// in both the cases notify the user with a mail, either thanking for contribution or saying sorry

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation
}

func addNotice(c *gin.Context) {
	// add the request model to the request.model.go file

	// add the notice in the database

	// publish a mail confirming notice published

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation
}
