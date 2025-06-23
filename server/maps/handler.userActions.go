//done review aya and moderation mai gaya,need to compress the image

package maps

import (
	"compass/connections"
	"encoding/json"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/rabbitmq/amqp091-go"
)
//will implement the compress while testing
func addReview(c *gin.Context) {

	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		c.JSON(400, gin.H{"error": "Failed to parse form data"})
		return
	}

	var reqModel AddReview
	if err := c.ShouldBind(&reqModel); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request data"})
		return
	}

	file, header, err := c.Request.FormFile("image")
	if err == nil {
		defer file.Close()

		// Ensure the uploads/reviews directory exists
		imageDir := "uploads/reviews/"
		if err := ensureDir(imageDir); err != nil {
			c.JSON(500, gin.H{"error": "Failed to create directory for image"})
			return
		}

		imagePath := imageDir + header.Filename
		if err := c.SaveUploadedFile(header, imagePath); err != nil {
			c.JSON(500, gin.H{"error": "Failed to save image"})
			return
		}

		reqModel.ImageURL = "/" + imagePath
	} else {
		reqModel.ImageURL = ""
	}

	reqModel.Status = "pending"

	if err := connections.DB.Create(&reqModel).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to add review"})
		return
	}

	body, err := json.Marshal(reqModel)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to serialize review for moderation"})
		return
	}
	err = connections.MQChannel.Publish(
		"",
		"moderate_review",
		false,
		false,
		amqp091.Publishing{
			ContentType: "application/json",
			Body:        body,
		},
	)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to add task for moderation"})
		return
	}

	c.JSON(200, gin.H{"message": "Review submitted and pending moderation"})
}

// ensureDir checks if a directory exists, and creates it if not.
func ensureDir(dirName string) error {
	err := os.MkdirAll(dirName, 0755)
	if err != nil {
		return err
	}
	return nil
}

func requestLocationAddition(c *gin.Context) {
	// add the request model in the respective file

	// add the location in the table with a pending status

	// Future TODO: add a logic to prevent attack on this route

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation
}
