package maps

import (
	"compass/connections"
	"compass/model"
	"fmt"
	"net/http"

	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
)

func addReview(c *gin.Context) {
	// if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
	// 	c.JSON(400, gin.H{"error": "Failed to parse form data"})
	// 	return
	// }

	// var reqModel AddReviewRequest
	// if err := c.ShouldBind(&reqModel); err != nil {
	// 	c.JSON(400, gin.H{"error": "Invalid request data"})
	// 	return
	// }

	// // Text Moderation
	// if flagged, err := workers.ModerateText(reqModel.Description); err != nil {
	// 	c.JSON(500, gin.H{"error": "Text moderation failed"})
	// 	return
	// } else if flagged {
	// 	reqModel.Status = "rejectedByBot"
	// 	connections.DB.Create(&reqModel)
	// 	c.JSON(403, gin.H{"error": "Text contains inappropriate content"})
	// 	return
	// }

	// imagePath := ""
	// file, _, err := c.Request.FormFile("image")
	// if err == nil {
	// 	defer file.Close()

	// 	imageDir := "uploads/reviews/"
	// 	if err := ensureDir(imageDir); err != nil {
	// 		c.JSON(500, gin.H{"error": "Failed to create directory for image"})
	// 		return
	// 	}

	// 	img, format, err := image.Decode(file)
	// 	if err != nil {
	// 		c.JSON(400, gin.H{"error": "Unsupported or invalid image format"})
	// 		return
	// 	}

	// 	//saving review to get ID
	// 	reqModel.Status = "pending"
	// 	reqModel.ImageURL = ""
	// 	if err := connections.DB.Create(&reqModel).Error; err != nil {
	// 		c.JSON(500, gin.H{"error": "Failed to add review"})
	// 		return
	// 	}

	// 	reviewID := int(reqModel.ID)
	// 	imagePath = fmt.Sprintf("uploads/reviews/review-%d.png", reviewID)
	// 	out, err := os.Create(imagePath)
	// 	if err != nil {
	// 		c.JSON(500, gin.H{"error": "Failed to create image file"})
	// 		return
	// 	}
	// 	defer func(out *os.File) {
	// 		err := out.Close()
	// 		if err != nil {
	// 			c.JSON(500, gin.H{"error": "Could not close output file"})
	// 			return
	// 		}
	// 	}(out)

	// 	switch strings.ToLower(format) {
	// 	case "jpeg", "jpg":
	// 		err = jpeg.Encode(out, img, &jpeg.Options{Quality: 80})
	// 	case "png":
	// 		encoder := png.Encoder{CompressionLevel: png.BestSpeed}
	// 		err = encoder.Encode(out, img)
	// 	default:
	// 		c.JSON(400, gin.H{"error": "Unsupported image format"})
	// 		return
	// 	}

	// 	if err != nil {
	// 		c.JSON(500, gin.H{"error": "Failed to compress and save image"})
	// 		return
	// 	}

	// 	reqModel = "/" + imagePath
	// 	connections.DB.Model(&AddReviewRequest{}).Where("id = ?", reviewID).Update("image_url", reqModel.ImageURL)

	// 	//Image moderation only if image is given
	// 	job := workers.ModerationJob{
	// 		ReviewID:  reviewID,
	// 		ImagePath: imagePath,
	// 	}
	// 	body, err := json.Marshal(job)
	// 	if err == nil {
	// 		err = connections.MQChannel.Publish(
	// 			"",
	// 			viper.GetString("rabbitmq.moderationqueue"),
	// 			false,
	// 			false,
	// 			amqp091.Publishing{
	// 				ContentType: "application/json",
	// 				Body:        body,
	// 			},
	// 		)
	// 		if err != nil {
	// 			c.JSON(500, gin.H{"error": "Failed to add task for moderation"})
	// 			return
	// 		}
	// 	}
	// } else {
	// 	reqModel.ImageURL = ""
	// 	if err := connections.DB.Create(&reqModel).Error; err != nil {
	// 		c.JSON(500, gin.H{"error": "Failed to add review"})
	// 		return
	// 	}
	// }

	// reqModel.Status = "pending"

	// c.JSON(200, gin.H{"message": "Review submitted and pending moderation"})
}

// ensureDir checks if a directory exists, and creates it if not.
// func ensureDir(dirName string) error {
// 	err := os.MkdirAll(dirName, 0755)
// 	if err != nil {
// 		return err
// 	}
// 	return nil
// }

func requestLocationAddition(c *gin.Context) {
	var req AddLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}
	newLocation := req.ToLocation()
	var missingCount int
	if len(newLocation.Name) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Place Name"})
		return
	}
	// Transaction will combine all steps and will do not do anything if any error occurs
	err := connections.DB.Transaction(func(tx *gorm.DB) error {
		// Create location
		if err := tx.Create(&newLocation).Error; err != nil {
			return err
		}
		// Associate CoverPic
		if req.CoverPic != nil {
			var coverPic model.Image
			if err := tx.First(&coverPic, "image_id = ?", *req.CoverPic).Error; err == nil {
				if err := tx.Model(&newLocation).Association("CoverPic").Replace(&coverPic); err != nil {
					return err
				}
			} else {
				missingCount++
			}
		}
		// Associate BioPics
		if len(*req.BioPics) > 0 {
			var bioPics []model.Image
			if err := tx.Where("image_id IN ?", *req.BioPics).Find(&bioPics).Error; err != nil {
				return err
			}
			if err := tx.Model(&newLocation).Association("BioPics").Replace(&bioPics); err != nil {
				return err
			}
			missingCount += len(*req.BioPics) - len(bioPics)
		}
		return nil
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to request location addition"})
		return
	}
	if missingCount > 0 {
		c.JSON(http.StatusOK, gin.H{
			"message": fmt.Sprintf("Location request submitted for review. But %d images could not be attached, due to server error", missingCount),
		})
	} else {
		c.JSON(http.StatusOK, gin.H{"message": "Location request submitted for review"})
	}
}
