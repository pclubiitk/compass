package model

import "gorm.io/gorm"

type Status string

const (
	Pending       Status = "pending"
	Approved      Status = "approved"
	Rejected      Status = "rejected"      // if rejected by admin finally
	RejectedByBot Status = "rejectedByBot" // if rejected by bot
)

type Location struct {
	gorm.Model
	LocationId    string   `gorm:"uniqueIndex" json:"location_id"`
	Name          string   `json:"name" binding:"required"`
	Description   string   `json:"description"`
	Latitude      float32  `json:"latitude" binding:"required"`
	Longitude     float32  `json:"longitude" binding:"required"`
	Status        Status   `gorm:"type:varchar(20);check:status IN ('pending','approved','rejected')"` // once the location is approved by the admin it will be publicly available
	ContributedBy string   `json:"contributedBy"`                                                      // This is the foreign key
	User          User     `gorm:"foreignKey:ContributedBy;references:UserID"`                         // many location to single user binding
	AverageRating float32  `json:"avg_rating"`
	ReviewCount   int64    `json:"ReviewCount"`
	Reviews       []Review `gorm:"foreignKey:LocationId;references:LocationId"` // one location to multi review binding
}

type Notice struct {
	gorm.Model
	NoticeId      string `gorm:"type:uuid;uniqueIndex" json:"notice_id"`
	Title         string `json:"title" binding:"required"`
	Description   string `gorm:"type:text" json:"description"`
	Preview   	  string `json:"preview"`
	CardDescription	  string `json:"card_description"`
	ContributedBy string `json:"contributedBy"` // This is the foreign key
	User          User   `gorm:"foreignKey:ContributedBy;references:UserID"`
	// we will expand to having images in the notice or urls to publicly hosted images
}

type Review struct {
	gorm.Model
	ReviewId      string  `gorm:"uniqueIndex" json:"review_id"`
	Rating        float32 `json:"rating"`
	Status        Status  `gorm:"type:varchar(20);check:status IN ('pending','approved','rejected', 'rejectedByBot')"` // as the user writes a review put the review in the database with pending
	ContributedBy string  `json:"contributedBy"`                                                                       // This is the foreign key
	LocationId    string  `json:"location_id"`
	User          User    `gorm:"foreignKey:ContributedBy;references:UserID"`
	ImageURL   string  `json:"image_url"`
}
