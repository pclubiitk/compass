package puppylove

import (
	"compass/connections"
	"compass/model"
	"compass/model/puppylove"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type PuppyLoveResetPasswordRequest struct {
	UserID   string `json:"id" binding:"required,uuid"`
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required,min=8"`
}

func AddRecovery(c *gin.Context) {
	// Validate the input format
	data := new(RecoveryCodeReq)
	if err := c.BindJSON(data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Input data format."})
		return
	}
	roll_no, exists := c.Get("rollNo")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID not found in context"})
		return
	}
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	var user model.User
	if err := connections.DB.
		Model(&model.User{}).
		Select("user_id", "password").
		Where("user_id = ?", userID).
		First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(data.Pass)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"valid": false})
		return
	}

	profile := puppylove.PuppyLoveProfile{}
	// First find the profile
	if err := connections.DB.Where("roll_no = ?", roll_no).First(&profile).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Please register for puppy love"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Some Error occurred. Please try later"})
		return
	}

	// Update the code field
	profile.Code = data.Code
	if err := connections.DB.Save(&profile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Some Error occurred. Please try later"})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"message": "Recovery Code Added Successfully!"})
}

func RetrievePass(c *gin.Context) {
	roll_no, exists := c.Get("rollNo")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID not found in context"})
		return
	}

	user := puppylove.PuppyLoveProfile{}
	record := connections.DB.Model(&user).Where("roll_no = ?", roll_no).First(&user)
	if record.Error != nil {
		if errors.Is(record.Error, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Puppy Love User Does Not Exist"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Some Error occured Please try later"})
		return
	} else {
		passCode := user.Code
		if passCode == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Didn't Registered With Recovery Codes"})
			return
		}
		c.JSON(http.StatusAccepted, gin.H{"message": "Successfully retrived code", "code": passCode})
		return
	}
}
