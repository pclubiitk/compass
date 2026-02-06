package puppylove

import (
	"compass/connections"
	"compass/model/puppylove"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"sync"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

var heartOperationsMutex sync.Mutex

// UserFirstLogin handles the first login/registration for PuppyLove
// Auth is handled by campus auth middleware, so user is already authenticated
func UserFirstLogin(c *gin.Context) {
	rollNo, exists := c.Get("rollNo")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID not found in context"})
		return
	}

	// Validate the input format
	info := new(TypeUserFirst)
	if err := c.BindJSON(info); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Input data format."})
		return
	}

	// Check if user already has a PuppyLove profile
	var existingProfile puppylove.PuppyLoveProfile
	if err := connections.DB.Where(&puppylove.PuppyLoveProfile{RollNo: rollNo.(string)}).First(&existingProfile).Error; err == nil {
		if existingProfile.Dirty {
			c.JSON(http.StatusMethodNotAllowed, gin.H{"error": "User already registered"})
			return
		}
	}

	// Check if public key is already in use
	var profileWithKey puppylove.PuppyLoveProfile
	if err := connections.DB.Where("pub_k = ?", info.PubKey).First(&profileWithKey).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Please enter another public key !!"})
		return
	}

	// Update or create the profile
	profile := puppylove.PuppyLoveProfile{
		RollNo: rollNo.(string),
		PubK:   info.PubKey,
		PrivK:  info.PrivKey,
		Data:   info.Data,
		Dirty:  true,
	}

	if err := connections.DB.Save(&profile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Something went wrong, Please try again."})
		return
	}

	// Store public key in Redis
	connections.RedisClient.HSet(connections.RedisCtx, "puppylove:public_keys", rollNo.(string), info.PubKey)

	c.JSON(http.StatusCreated, gin.H{"message": "User Created Successfully."})
}

func GetUserData(c *gin.Context) {
	roll_no, exists := c.Get("rollNo")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID not found in context"})
		return
	}

	var profile puppylove.PuppyLoveProfile
	result := connections.DB.Where("roll_no = ?", roll_no).First(&profile)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	permit := IsPuppyLovePermitted()

	c.JSON(http.StatusOK, gin.H{
		"message":  "Data retrieved successfully !!",
		"id":       roll_no,
		"data":     profile.Data,
		"gender":   profile.Gender,
		"submit":   profile.Submit,
		"claims":   profile.Claims,
		"permit":   permit,
		"publish":  profile.Publish,
		"about":    profile.About,
		"interest": profile.Interests,
	})
}

// SendHeartWithReturn sends hearts and handles return hearts
func SendHeartWithReturn(c *gin.Context) {
	info := new(SendHeartFirst)
	if err := c.BindJSON(info); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Input data format."})
		return
	}

	roll_no, exists := c.Get("rollNo")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID not found in context"})
		return
	}

	var profile puppylove.PuppyLoveProfile
	if err := connections.DB.Where("roll_no = ?", roll_no).First(&profile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Something went wrong, Please try again."})
		return
	}

	if profile.Submit {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Hearts already sent."})
		return
	}

	if info.ENC1 != "" && info.SHA1 != "" {
		newheart1 := puppylove.SendHeart{
			SHA:            info.SHA1,
			ENC:            info.ENC1,
			SONG_ENC:       info.SONG1,
			GenderOfSender: info.GenderOfSender,
		}
		if err := connections.DB.Create(&newheart1).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	// Mark as submitted
	if err := connections.DB.Model(&profile).Where("roll_no = ?", roll_no).Update("submit", true).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Something went wrong, Please try again."})
		return
	}

	if info.ENC2 != "" && info.SHA2 != "" {
		newheart2 := puppylove.SendHeart{
			SHA:            info.SHA2,
			ENC:            info.ENC2,
			SONG_ENC:       info.SONG2,
			GenderOfSender: info.GenderOfSender,
		}
		if err := connections.DB.Create(&newheart2).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error in submitting heart 1": err.Error()})
			return
		}
	}

	if info.ENC3 != "" && info.SHA3 != "" {
		newheart3 := puppylove.SendHeart{
			SHA:            info.SHA3,
			ENC:            info.ENC3,
			SONG_ENC:       info.SONG3,
			GenderOfSender: info.GenderOfSender,
		}
		if err := connections.DB.Create(&newheart3).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error in submitting heart 2": err.Error()})
			return
		}
	}

	if info.ENC4 != "" && info.SHA4 != "" {
		newheart4 := puppylove.SendHeart{
			SHA:            info.SHA4,
			ENC:            info.ENC4,
			SONG_ENC:       info.SONG4,
			GenderOfSender: info.GenderOfSender,
		}
		if err := connections.DB.Create(&newheart4).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error in submitting heart 3": err.Error()})
			return
		}
	}

	// Process return hearts
	for _, heart := range info.ReturnHearts {
		enc := heart.Enc
		sha := heart.SHA
		song := heart.SONG_ENC

		if err := ReturnClaimedHeart(enc, sha, song, roll_no.(string)); err != nil {
			c.JSON(http.StatusAccepted, gin.H{"message": "Hearts Sent Successfully !!, but found invalid Claim Requests. It will be recorded"})
			return
		}
	}

	// TODO: cookie HeartBack
	c.JSON(http.StatusAccepted, gin.H{"message": "Hearts Sent Successfully !!"})
}

func SendHeartVirtualHandler(c *gin.Context) {
	info := new(SendHeartVirtual)
	if err := c.BindJSON(info); err != nil {

		c.JSON(http.StatusBadRequest, gin.H{"error": "Wrong Format"})
		return
	}

	roll_no, exists := c.Get("rollNo")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID not found in context"})
		return
	}

	var profile puppylove.PuppyLoveProfile
	record := connections.DB.Where("roll_no = ?", roll_no).First(&profile)
	if record.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User does not exist."})
		return
	}

	if profile.Submit {
		c.JSON(http.StatusOK, gin.H{"error": "Hearts already sent."})
		return
	}

	jsonData, err := json.Marshal(info.Hearts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process hearts data."})
		return
	}

	if err := record.Updates(puppylove.PuppyLoveProfile{
		Data: string(jsonData),
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not update Data field of User."})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"message": "Virtual Hearts Sent Successfully !!"})
}

// HeartClaimError represents an error during heart claiming
type HeartClaimError struct {
	Message string
}

func (e HeartClaimError) Error() string {
	return e.Message
}

// ReturnClaimedHeart processes a claimed heart return
func ReturnClaimedHeart(enc string, sha string, song string, roll_no string) error {
	if enc == "" || sha == "" {
		return nil
	}

	// Verify the heart claim exists
	var heartClaim puppylove.HeartClaims
	if err := connections.DB.Where("sha = ? AND roll_no = ?", sha, roll_no).First(&heartClaim).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return HeartClaimError{Message: "Unauthorized Heart Claim attempt, it will be recorded."}
		}
		return HeartClaimError{Message: err.Error()}
	}

	// Create return heart record
	returnHeart := puppylove.ReturnHearts{
		SHA:      sha,
		ENC:      enc,
		SONG_ENC: song,
	}
	if err := connections.DB.Create(&returnHeart).Error; err != nil {
		return HeartClaimError{Message: "Something Unexpected Occurred while adding the heart claim."}
	}

	return nil
}

// HeartClaimHandler handles claiming a heart
func HeartClaimHandler(c *gin.Context) {
	info := new(VerifyHeartClaim)
	if err := c.BindJSON(info); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Input data format."})
		return
	}

	roll_no, exists := c.Get("rollNo")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID not found in context"})
		return
	}

	claimStatus := "true"

	heartOperationsMutex.Lock()
	defer heartOperationsMutex.Unlock()

	// use a transaction to ensure atomicity for find+delete+insert operations

	err := connections.DB.Transaction(func(tx *gorm.DB) error {
		heartModel := puppylove.SendHeart{}
		if err := tx.Where("sha = ? AND enc = ?", info.SHA, info.Enc).First(&heartModel).Error; err != nil {
			return err
		}

		if err := tx.Where("sha = ? AND enc = ?", info.SHA, info.Enc).Unscoped().Delete(&heartModel).Error; err != nil {
			return err
		}

		heartClaim := puppylove.HeartClaims{
			Id:       info.Enc,
			SHA:      info.SHA,
			Roll:     roll_no.(string),
			SONG_ENC: heartModel.SONG_ENC,
		}

		if err := tx.Create(&heartClaim).Error; err != nil {
			return err
		}
		var profile puppylove.PuppyLoveProfile
		if err := tx.Where("roll_no = ?", roll_no.(string)).First(&profile).Error; err != nil {
			return err
		}

		// Generate the appended claim string
		jsonClaim, _ := json.Marshal(info) // Error ignored as struct is safe
		newClaimEnc := url.QueryEscape(string(jsonClaim))

		if profile.Claims == "" {
			profile.Claims = newClaimEnc
		} else {
			profile.Claims = profile.Claims + "+" + newClaimEnc
		}

		if err := tx.Save(&profile).Error; err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid Heart Claim Request.", "claim_status": "false"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"message": "Heart Claim Success", "claim_status": claimStatus})
}

// ReturnClaimedHeartLate handles late return of claimed hearts
func ReturnClaimedHeartLate(c *gin.Context) {
	info := new(UserReturnHearts)
	if err := c.BindJSON(info); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Input data format."})
		return
	}

	roll_no, exists := c.Get("rollNo")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID not found in context"})
		return
	}

	for _, heart := range info.ReturnHearts {
		enc := heart.ENC
		sha := heart.SHA
		song := heart.SONG_ENC
		if err := ReturnClaimedHeart(enc, sha, song, roll_no.(string)); err != nil {
			c.JSON(http.StatusAccepted, gin.H{"message": "Found invalid Claim Requests. It will be recorded"})
			return
		}
	}

	c.JSON(http.StatusAccepted, gin.H{"message": "Congrats !!, we just avoided unexpected event with probability < 1/1000."})
}

// PublishProfile marks user as willing to publish matches
func PublishProfile(c *gin.Context) {
	if IsPuppyLoveResultsPublished() {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Results Published"})
		return
	}

	roll_no, exists := c.Get("rollNo")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID not found in context"})
		return
	}

	if err := connections.DB.Model(&puppylove.PuppyLoveProfile{}).
		Where("roll_no = ?", roll_no).
		Update("publish", true).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Something went wrong, Please try again."})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile marked for publishing"})
}

// GetActiveUsers returns list of active (dirty) users
func GetActiveUsers(c *gin.Context) {
	var profiles []puppylove.PuppyLoveProfile
	connections.DB.Find(&profiles)

	var results []string
	for _, profile := range profiles {
		if profile.Dirty {
			results = append(results, profile.RollNo)
		}
	}

	c.JSON(http.StatusOK, gin.H{"users": results})
}

// VerifyReturnHeartHandler verifies heart claims from returned table and handles match logic
func VerifyReturnHeartHandler(c *gin.Context) {
	info := new(VerifyReturnHeartClaim)
	if err := c.BindJSON(info); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Input data format."})
		return
	}

	h := sha256.New()
	h.Write([]byte(info.Secret))
	hash := fmt.Sprintf("%x", h.Sum(nil))

	rollNo, _ := c.Get("rollNo")
	userRoll := rollNo.(string) // Type assertion for safety

	heartOperationsMutex.Lock()
	defer heartOperationsMutex.Unlock()

	err := connections.DB.Transaction(func(tx *gorm.DB) error {
		var heartModel puppylove.ReturnHearts
		if err := tx.Where("sha = ? AND enc = ?", hash, info.Enc).First(&heartModel).Error; err != nil {
			return err // Returns error if heart not found
		}

		var heartClaim puppylove.HeartClaims
		if err := tx.Where("sha = ?", hash).First(&heartClaim).Error; err != nil {
			return err
		}

		var existingMatch puppylove.MatchTable
		checkErr := tx.Where("roll1 = ? AND roll2 = ?", heartClaim.Roll, userRoll).First(&existingMatch).Error

		if checkErr == nil {
			// Error is nil, meaning a record WAS found. This is bad (Match already exists).
			return errors.New("MATCH_EXISTS")
		}
		if !errors.Is(checkErr, gorm.ErrRecordNotFound) {
			// If the error is anything other than "Not Found", it's a real DB error.
			return checkErr
		}

		// 4. CREATE MATCH (Moved INSIDE transaction for safety)
		match := puppylove.MatchTable{
			Roll1:  userRoll,
			Roll2:  heartClaim.Roll,
			SONG12: heartClaim.SONG_ENC,
			SONG21: heartModel.SONG_ENC, // We can access heartModel here safely
		}
		if err := tx.Create(&match).Error; err != nil {
			return err
		}

		// 5. DELETE HEART (Consume the record)
		if err := tx.Unscoped().Delete(&heartModel).Error; err != nil {
			return err
		}

		return nil
	})
	// END TRANSACTION
	if err != nil {
		if err.Error() == "MATCH_EXISTS" {
			c.JSON(http.StatusAccepted, gin.H{"message": "Match Already Done from other side"})
			return
		}
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid Heart Claim Request."})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"message": "Heart Claim Success"})
}

// MatchesHandler returns the user's matches if results are published
func MatchesHandler(c *gin.Context) {
	if IsPuppyLoveResultsPublished() {
		roll_no, exists := c.Get("rollNo")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "User ID not found in context"})
			return
		}

		var profile puppylove.PuppyLoveProfile
		if err := connections.DB.Where("roll_no = ?", roll_no).First(&profile).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
			return
		}

		if !profile.Publish {
			c.JSON(http.StatusOK, gin.H{"msg": "You chose not to publish results"})
			return
		}

		// Unmarshal Matches field for response
		var matches map[string]string
		if len(profile.Matches) > 0 {
			_ = json.Unmarshal(profile.Matches, &matches)
		} else {
			matches = make(map[string]string)
		}

		c.JSON(http.StatusOK, gin.H{"matches": matches})
		return
	}

	c.JSON(http.StatusOK, gin.H{"msg": "Matches not yet published"})
}
