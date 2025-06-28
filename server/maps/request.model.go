package maps


import "compass/model"
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
	Id int `json:"id"` // have to make unique or auto-increment
	Title string `json:"title"`
	Latitude float32 `json:"latitude"`
	Longitude float32 `json:"longitude"`
	Location_type string `json:"location_type"`
	Contributor_id string `json:"contributor_id"` //contributedBy
	Description string `json:"description"` // have to add ch limit
	Image string `json:"image"` // image url
	Status  model.Status `json:"action"`  // "approved" or "rejected"
	Message string `json:"message"`
}

type AddNotice struct {
	NoticeId        string `gorm:"uniqueIndex" json:"notice_id"`
	Title           string `json:"title" binding:"required"`
	Preview         string `json:"preview"`
	CardDescription string `json:"cardDescription"`
	Description     string `json:"description"`
	ContributedBy   string `json:"contributedBy"`
}
type FlagActionRequest struct {
	Action  string `json:"action" binding:"required,oneof=approved rejected"`
	Message string `json:"message"` // Only required if rejected
}
