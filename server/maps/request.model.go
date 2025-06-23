//mytask done
package maps

// Complete the following request models



type User struct {
	UserID string `json:"user_id"`
	// Add other fields as needed
}

type AddReview struct {
	Rating     float32 `json:"rating"`
	Status     string  `gorm:"type:varchar(20);check:status IN ('pending','approved','rejected', 'rejectedByBot')"`
	LocationId string  `json:"location_id"`
	User       string  `json:"UserID"`
	ImageURL   string  `json:"image_url"`
}

type RequestAddLocation struct {

}

type AddNotice struct {

}
type FlagActionRequest struct {
		Action  string `json:"action" binding:"required,oneof=approved rejected"`
		Message string `json:"message"` // Only required if rejected
	}
