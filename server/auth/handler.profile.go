package auth

import (
	"compass/connections"
	"compass/middleware"
	"compass/model"
	"errors"
	"net/http"

	"encoding/json"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func updatePassword(c *gin.Context) {
	var input UpdatePasswordRequest
	var user model.User
	var err error
	var newPasswordHash []byte

	// TODO: Many functions have this repetition, extract out.
	// Request Validation
	userID, exist := c.Get("userID")
	if !exist {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}
	// find the current user, we are sure it exist
	connections.DB.Model(&model.User{}).Where("user_id = ?", userID.(uuid.UUID)).First(&user)

	if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.NewPassword)) != nil {
		if len(input.NewPassword) < 8 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 8 characters"})
			return
		}
		if newPasswordHash, err = bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable create new password"})
		}
	}
	if err := connections.DB.Model(&model.User{}).
		Where("user_id = ?", userID.(uuid.UUID)).
		Update("password", string(newPasswordHash)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed update password"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}

// func updateProfileImage(){
// 	// TODO: set up for images, for image upload, if the similarity is > 90,can ignore it (can think)
// }

func verifyProfile(c *gin.Context, profileData model.Profile) bool {
	// OA's verification route, do not take name input, but returns name upon verification
	// Creating the paramkey string
	paramkey := fmt.Sprintf("%s:%s:%s:%s", profileData.RollNo, profileData.Course, profileData.Dept, profileData.Email)

	// Send request to verify student data
	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", fmt.Sprintf("%s?paramkey=%s", viper.GetString("oa.url"), paramkey), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create verification request"})
		return false
	}
	req.Header.Set("x-api-key", viper.GetString("oa.key"))
	req.Header.Set("Accept", "application/json")
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to call OA API"})
		return false
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusForbidden {
			logrus.Errorf("OA Token expired or missing, Urgent action required, request new or check viper env")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Programming club's oa token expired, we are working to resolve it as soon as possible"})
		} else {
			logrus.Error("OA API ERROR, with status code: ", resp.StatusCode)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Some error occurred in profile verification, please try again later."})
		}
		return false
	}

	var apiResp CCResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse OA API response"})
		return false
	}

	// Checking Status of verification
	if apiResp.Status != nil {
		if *apiResp.Status != "true" || (profileData.Name != *apiResp.Name) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Please once verify you data. It should be exactly same as printed on your ID card or displayed in IITK APP",
			})
			return false
		}
	} else {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Student data not verified",
		})
		return false
	}
	return true
}

func updateProfile(c *gin.Context) {
	var input ProfileUpdateRequest

	// TODO: Many functions have this repetition, extract out.
	// Request Validation
	userID, exist := c.Get("userID")
	if !exist {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	var user model.User
	if connections.DB.
		Model(&model.User{}).
		Select("user_id, email").
		Preload("Profile").
		First(&user, "user_id = ?", userID.(uuid.UUID)).Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User does not exist"})
		return
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}
	// find the current user, we are sure it exist
	profileData := model.Profile{
		// We set the UserID from the authenticated user's token, not from the input
		UserID:     userID.(uuid.UUID),
		Email:      user.Email,
		Name:       input.Name,
		RollNo:     input.RollNo,
		Dept:       input.Dept,
		Course:     input.Course,
		Gender:     input.Gender,
		Hall:       input.Hall,
		RoomNumber: input.RoomNumber,
		HomeTown:   input.HomeTown,
	}

	// Check if verification request is needed, email should be same, it can't be changed
	if user.Profile.Name != profileData.Name ||
		user.Profile.RollNo != profileData.RollNo ||
		user.Profile.Dept != profileData.Dept ||
		user.Profile.Course != profileData.Course {
		// Verify from oa
		if !verifyProfile(c, profileData) {
			return
		}

	}

	// Update into db
	if err := connections.DB.
		// Look for a profile with this user_id
		Where(model.Profile{UserID: userID.(uuid.UUID)}).
		// If found, update it with the new data. If not found, these values will be used for creation.
		Assign(profileData).
		// Executes the find, update, or create.
		FirstOrCreate(&model.Profile{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})

}

func getProfileHandler(c *gin.Context) {
	var user model.User
	userID, exist := c.Get("userID")
	if !exist {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	err := connections.DB.
		Model(&model.User{}).
		Preload("Profile").
		Preload("ContributedLocations", connections.RecentFiveLocations).
		Preload("ContributedNotice", connections.RecentFiveNotices).
		Preload("ContributedReview", connections.RecentFiveReviews).
		Omit("password").
		Where("user_id = ?", userID.(uuid.UUID)).Omit("password").First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User does not exist"})
			middleware.ClearAuthCookie(c)
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to fetch profile at the moment"})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"profile": user})

}

func autoC(c *gin.Context) {
	userID, exist := c.Get("userID")
	if !exist {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var user model.User
	if err := connections.DB.
		Model(&model.User{}).
		Select("email").
		Where("user_id = ?", userID.(uuid.UUID)).
		First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user details"})
		}
		return
	}

	automationServerURL := viper.GetString("automation.url")
	if automationServerURL == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Auth server configuration missing"})
		return
	}
	client := &http.Client{Timeout: 10 * time.Second}
	reqURL := fmt.Sprintf("%s/getDetails?email=%s", automationServerURL, user.Email)

	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		logrus.WithError(err).Error("Failed to create automation request")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}

	if authCookie, err := c.Cookie("auth"); err == nil {
		req.AddCookie(&http.Cookie{
			Name:  "auth",
			Value: authCookie,
		})
	}

	resp, err := client.Do(req)
	if err != nil {
		logrus.WithError(err).Error("Failed to call automation server")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to call automation server"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		switch resp.StatusCode {
		case http.StatusUnauthorized:
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication failed"})
		case http.StatusNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": "Not Found."})
		default:
			logrus.WithField("status", resp.StatusCode).Error("Automation server returned error")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Automation Server returned error"})
		}
		return
	}

	var studentDetails StudentDetails
	if err := json.NewDecoder(resp.Body).Decode(&studentDetails); err != nil {
		logrus.WithError(err).Error("Failed to parse auth server response")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse student details"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"automation": studentDetails,
	})
}
