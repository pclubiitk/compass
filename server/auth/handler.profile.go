package auth

import (
	"compass/connections"
	"compass/middleware"
	"compass/model"
	"errors"
	"net/http"
	"strings"

	"encoding/json"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"gorm.io/gorm"
)


// func updateProfileImage(){
// 	// TODO: set up for images, for image upload, if the similarity is > 90,can ignore it (can think)
// }

func verifyProfile(c *gin.Context, profileData model.Profile) bool {
	// OA's verification route, do not take name input, but returns name upon verification
	// TODO: Add logic to check if that roll no is already registered or not
	paramkey := fmt.Sprintf("%s:%s:%s:%s", profileData.RollNo, profileData.Course, profileData.Dept, profileData.Email)
	// TODO: put this url in the env file
	// req, err := http.NewRequest("GET", fmt.Sprintf("http://localhost:5000/verify?paramkey=%s", paramkey), nil)

	req, err := http.NewRequest("GET", fmt.Sprintf("%s?paramkey=%s", viper.GetString("oa.url"), paramkey), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return false
	}
	req.Header.Set("x-api-key", viper.GetString("oa.key"))
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to call OA API"})
		return false
	}
	defer resp.Body.Close()

	if resp.StatusCode == 401 {
		// Log the critical error
		// Send mail to maintainers
		logrus.Errorf("OA Token expired or missing, Urgent action required, request new or check viper env")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Programming club's oa token expired, we are working to resolve it as soon as possible"})
		return false
	} else if resp.StatusCode != 200 {
		logrus.Error("OA API ERROR, with status code: ", resp.StatusCode)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Details"})
		return false
	}
	// Parse the response
	var apiResp CCResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse OA API response"})
		return false
	}

	// Checking Status of verification
	if apiResp.Status != nil {
		if *apiResp.Status != "true" || (!strings.EqualFold(profileData.Name, *apiResp.Name)) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Please verify you data. It should be exactly same as: 1. on your ID card, or 2. displayed in IITK APP or 3. Initial Branch, if Branch is changed.",
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

// Returns: (baccha, bapu, error)
func removeDummyAccount(tx *gorm.DB, rollNo string) (string, string, error) {
	dummyEmail := fmt.Sprintf("cmhw_%s", rollNo)
	
	var dummyUser model.User
	// check if dummy user exists
	if err := tx.Where("email = ?", dummyEmail).First(&dummyUser).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", "", nil // Nothing found, return empty strings
		}
		return "", "", err
	}

	var dummyProfile model.Profile
	var baccha, bapu string

	// we try to find the profile, okay if it doesn't exist (though it should)
	if err := tx.Where("user_id = ?", dummyUser.UserID).First(&dummyProfile).Error; err == nil {
		baccha = dummyProfile.Bachhas
		bapu = dummyProfile.Bapu
	}

	// 3. Soft Delete the Profile
	if err := tx.Where("user_id = ?", dummyUser.UserID).Delete(&model.Profile{}).Error; err != nil {
		logrus.Errorf("Failed to soft-delete dummy profile for user %s: %v", dummyUser.UserID, err)
		return "", "", err
	}

	// 4. Soft Delete the User
	if err := tx.Delete(&dummyUser).Error; err != nil {
		logrus.Errorf("Failed to soft-delete dummy user %s: %v", dummyUser.UserID, err)
		return "", "", err
	}

	// Delete any pre-existing log for this user
	// (as it is syncing data based on change_logs table)
	if err := tx.Where("user_id = ?", dummyUser.UserID).Delete(&model.ChangeLog{}).Error; err != nil {
		return "", "", err
	}


	// 5. Log the "delete" action
	logEntry := model.ChangeLog{
		UserID: dummyUser.UserID,
		Action: "delete",
	}
	if err := tx.Create(&logEntry).Error; err != nil {
		return "", "", err
	}
	
	logrus.Infof("Preserved data Bacchas, Bapu and soft-deleted dummy for roll %s", rollNo)
	
	// Return the preserved data
	return baccha, bapu, nil
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
	// find the current user, we are sure it exist
	var user model.User
	if connections.DB.
		Model(&model.User{}).
		Select("user_id, email, profile_pic ").
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

	// TODO: resolve this.
	var newPfpPath string

	if user.ProfilePic == false {
		if path, err := FetchAndSaveProfileImage(input.RollNo, user.Email, userID.(uuid.UUID)); err == nil && path != "" {
			newPfpPath = path
		}
	}

	// TODO: Test it
	// Update into db
	if err := connections.DB.Transaction(func(tx *gorm.DB) error {
		// retrieve data and cleanup dummy 
        // must run before we assign the RollNo to the current user
        savedBaccha, savedBapu, err := removeDummyAccount(tx, profileData.RollNo)
        if err != nil {
            return err 
        }

        // --- [NEW] STEP 2: MERGE PRESERVED DATA ---
        // If the dummy account had "Baccha/Bapu" data, inject it into the profile
        if savedBaccha != "" {
            profileData.Bachhas = savedBaccha
        }
        if savedBapu != "" {
            profileData.Bapu = savedBapu
        }
		// Update or Create the Profile // 'tx' here instead of 'connections.DB' for one single step
		if err := tx.
			Where(model.Profile{UserID: userID.(uuid.UUID)}).
			// If found, update it with the new data. If not found, these values will be used for creation.
			Assign(profileData).
			// Executes the find, update, or create.
			FirstOrCreate(&model.Profile{}).Error; err != nil {
			return err
		}

		// Update ProfilePic if we fetched a new one
		if newPfpPath != "" {
			if err := tx.Model(&model.User{}).Where("user_id = ?", userID).Update("profile_pic", true).Error; err != nil {
				return err
			}
		}

		// Delete any pre-existing log for this user
		// (as it is syncing data based on change_logs table)
		if err := tx.Where("user_id = ?", userID).Delete(&model.ChangeLog{}).Error; err != nil {
			return err
		}
		// Create the new Log Entry
		logEntry := model.ChangeLog{
			UserID: userID.(uuid.UUID),
			Action: "update",
		}
		if err := tx.Create(&logEntry).Error; err != nil {
			return err
		}

		return nil
	}); err != nil {
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

	req.Header.Set("x-api-key", viper.GetString("automation.key"))
	req.Header.Set("Accept", "application/json")

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
