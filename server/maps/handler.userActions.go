package maps

import (
	"compass/connections"
	"compass/workers"
	"encoding/json"
	"fmt"
	"github.com/rabbitmq/amqp091-go"
	"github.com/spf13/viper"
	"os"

	"image"
	"image/jpeg"
	"image/png"

	"github.com/gin-gonic/gin"
	"strings"
)

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

	imagePath := ""
	file, _, err := c.Request.FormFile("image")
	if err == nil {
		defer file.Close()

		imageDir := "uploads/reviews/"
		if err := ensureDir(imageDir); err != nil {
			c.JSON(500, gin.H{"error": "Failed to create directory for image"})
			return
		}

		img, format, err := image.Decode(file)
		if err != nil {
			c.JSON(400, gin.H{"error": "Unsupported or invalid image format"})
			return
		}

		//saving review to get ID
		reqModel.Status = "pending"
		reqModel.ImageURL = ""
		reviewID := int(reqModel.ID)

		imagePath = fmt.Sprintf("uploads/reviews/review-%d.png", reviewID)
		out, err := os.Create(imagePath)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to create image file"})
			return
		}
		defer func(out *os.File) {
			err := out.Close()
			if err != nil {
				c.JSON(500, gin.H{"error": "Could not close output file"})
				return
			}
		}(out)

		switch strings.ToLower(format) {
		case "jpeg", "jpg":
			err = jpeg.Encode(out, img, &jpeg.Options{Quality: 80})
		case "png":
			encoder := png.Encoder{CompressionLevel: png.BestSpeed}
			err = encoder.Encode(out, img)
		default:
			c.JSON(400, gin.H{"error": "Unsupported image format"})
			return
		}

		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to compress and save image"})
			return
		}

		//Image moderation only if image is given
		job := workers.ModerationJob{
			ReviewID:  reviewID,
			ImagePath: imagePath,
		}
		body, err := json.Marshal(job)
		if err == nil {
			err = connections.MQChannel.Publish(
				"",
				viper.GetString("rabbitmq.moderationqueue"),
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
	var req RequestAddLocation

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	// Validate required fields
	if req.Title == "" || req.Contributor_id == "" || req.Latitude == 0 || req.Longitude == 0 {
		c.JSON(400, gin.H{"error": "Missing required fields"})
		return
	}

	// add the location in the table with a pending status
	req.Status = "pending"

	if err := connections.DB.Create(&req).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to save location request"})
		return
	}

	c.JSON(200, gin.H{"message": "Location request submitted for review"})
	// Future TODO: add a logic to prevent attack on this route

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation
}
