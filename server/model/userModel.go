package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Status string

const (
	Pending       Status = "pending"
	Approved      Status = "approved"
	Rejected      Status = "rejected"      // if rejected by admin finally
	RejectedByBot Status = "rejectedByBot" // if rejected by bot
)

type Location struct {
	CreatedAt     time.Time
	UpdatedAt     time.Time
	DeletedAt     gorm.DeletedAt `gorm:"index"`
	LocationId    uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Name          string         `json:"name" binding:"required"`
	Description   string         `json:"description"`
	Latitude      float32        `json:"latitude" binding:"required"`
	Longitude     float32        `json:"longitude" binding:"required"`
	Status        Status         `gorm:"type:varchar(20);check:status IN ('pending','approved','rejected')"`                        // once the location is approved by the admin it will be publicly available
	ContributedBy uuid.UUID      `json:"contributedBy"`                                                                             // This is the foreign key
	User          *User          `gorm:"foreignKey:ContributedBy;references:UserID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"` // many location to single user binding
	AverageRating float32        `json:"avg_rating"`
	ReviewCount   int64          `json:"ReviewCount"`
	Reviews       []Review       `gorm:"foreignKey:LocationId;references:LocationId"` // one location to multi review binding
	CoverPic      *Image         `gorm:"polymorphic:Owner;" json:"coverpic"`
	BioPics       []Image        `gorm:"polymorphic:Owner;" json:"biopics"`
}

type Notice struct {
	CreatedAt       time.Time
	UpdatedAt       time.Time
	DeletedAt       gorm.DeletedAt `gorm:"index"`
	NoticeId        uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Title           string         `json:"title" binding:"required"`
	Description     string         `gorm:"type:text" json:"description"`
	Preview         string         `json:"preview"`
	CardDescription string         `json:"card_description"`
	ContributedBy   uuid.UUID      `json:"contributedBy"`
	User            *User          `gorm:"foreignKey:ContributedBy;references:UserID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
	CoverPic        *Image         `gorm:"polymorphic:Owner;" json:"coverpic"`
	BioPics         []Image        `gorm:"polymorphic:Owner;" json:"biopics"`
}

type Review struct {
	CreatedAt     time.Time
	UpdatedAt     time.Time
	DeletedAt     gorm.DeletedAt `gorm:"index"`
	ReviewId      uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Description   string         `gorm:"type:text" json:"description"`
	Rating        float32        `json:"rating"`
	Status        Status         `gorm:"type:varchar(20);check:status IN ('pending','approved','rejected', 'rejectedByBot')"` // as the user writes a review put the review in the database with pending
	ContributedBy uuid.UUID      `json:"contributedBy"`                                                                       // This is the foreign key
	LocationId    uuid.UUID      `json:"location_id"`
	User          *User          `gorm:"foreignKey:ContributedBy;references:UserID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
	ImageURL      string         `json:"image_url"`
	CoverPic      *Image         `gorm:"polymorphic:Owner;" json:"coverpic"`
	BioPics       []Image        `gorm:"polymorphic:Owner;" json:"biopics"`
}
