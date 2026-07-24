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
	LocationId    uuid.UUID      `json:"locationId" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Name          string         `json:"name" binding:"required"`
	Description   string         `json:"description"`
	Latitude      float32        `json:"latitude" binding:"required"`
	Longitude     float32        `json:"longitude" binding:"required"`
	LocationType  string         `json:"locationType"`
	Layer         int            `json:"layer"`
	Status        Status         `json:"status" gorm:"type:varchar(20);check:status IN ('pending','approved','rejected')"`          // once the location is approved by the admin it will be publicly available
	ContributedBy uuid.UUID      `json:"contributedBy"`                                                                             // This is the foreign key
	User          *User          `gorm:"foreignKey:ContributedBy;references:UserID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"` // many location to single user binding
	AverageRating float32        `json:"avgRating"`
	ReviewCount   int64          `json:"reviewCount"`
	Tag           string         `json:"tag"`
	Contact       string         `json:"contact"`
	Time          string         `json:"time"`
	Reviews       []Review       `gorm:"foreignKey:LocationId;references:LocationId"` // one location to multi review binding
	CoverPic      *Image         `gorm:"polymorphic:ParentAsset;" json:"coverpic"`
	BioPics       []Image        `gorm:"polymorphic:ParentAsset;" json:"biopics"`
}

type Notice struct { // change this to ritika's PR, can remove the contributedBy field
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"-"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
	Entity        string         `json:"entity"`       // Department / Club / Cell
	EventTime     time.Time      `json:"eventTime"`    // When the event/notice is relevant
	EventEndTime  time.Time      `json:"eventEndTime"` // When the event/notice is relevant
	Location      string         `json:"location"`     // Venue or online link
	NoticeId      uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Title         string         `json:"title" binding:"required"`
	Description   string         `gorm:"type:text" json:"description"`
	Body          string         `json:"body,omitempty"` // added omitempty
	ContributedBy uuid.UUID      `json:"contributedBy"`
	User          *User          `gorm:"foreignKey:ContributedBy;references:UserID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"user,omitempty"`
	CoverPic      *Image         `gorm:"polymorphic:ParentAsset;" json:"coverPic"`
	BioPics       []Image        `gorm:"polymorphic:ParentAsset;" json:"bioPics"`
}

type Review struct {
    CreatedAt     time.Time
    UpdatedAt     time.Time
    DeletedAt     gorm.DeletedAt `gorm:"index"`
    ReviewId      uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"reviewId"`
    Description   string         `gorm:"type:text" json:"description"`
    Rating        int8           `json:"rating"`
    Status        Status         `gorm:"type:varchar(20);check:status IN ('pending','approved','rejected', 'rejectedByBot')" json:"status"`
    ContributedBy uuid.UUID      `json:"contributedBy"`
    LocationId    uuid.UUID      `json:"locationId"`
    User          *User          `gorm:"foreignKey:ContributedBy;references:UserID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"user"`
    Images        []Image        `gorm:"polymorphic:ParentAsset;polymorphicValue:Review" json:"images"`
}

// UserEvent represents a personal calendar event created by a user.
// Completely separate from admin-published Notices.
// Users can only see, edit, and delete their own events.
type UserEvent struct {
	CreatedAt            time.Time      `json:"created_at"`
	UpdatedAt            time.Time      `json:"-"`
	DeletedAt            gorm.DeletedAt `gorm:"index" json:"-"`
	EventId              uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"eventId"`
	Title                string         `json:"title" binding:"required"`
	Description          string         `gorm:"type:text" json:"description"`
	EventTime            time.Time      `json:"eventTime"`
	EventEndTime         time.Time      `json:"eventEndTime"`
	Color                string         `json:"color"`
	RecurrenceType       string         `json:"recurrenceType"`                    // "" (one-off) or "weekly"
	RecurrenceEnd        *time.Time     `json:"recurrenceEnd"`                     // nil = repeats forever; set to bound recurrence
	RecurrenceExceptions string         `gorm:"type:text" json:"recurrenceExceptions"` // comma-separated YYYY-MM-DD dates to skip (holidays, breaks)
	ContributedBy        uuid.UUID      `gorm:"index" json:"contributedBy"`
	User                 *User          `gorm:"foreignKey:ContributedBy;references:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
}
