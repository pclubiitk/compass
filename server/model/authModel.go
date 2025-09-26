package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Role int

const (
	AdminRole Role = 100 // "admin"
	Bot       Role = 99  // "bot"
	UserRole  Role = 50  // "user"
	// TODO: add roles like Super Admin, Visitors
)

type User struct {
	CreatedAt            time.Time      `json:"-"`
	UpdatedAt            time.Time      `json:"-"`
	DeletedAt            gorm.DeletedAt `gorm:"index"`
	UserID               uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Email                string         `gorm:"unique" json:"email"`
	Password             string         `json:"password"`
	Name                 string         `json:"name"`
	IsVerified           bool           `json:"-"`
	VerificationToken    string         `json:"-"` //erased after verification
	Role                 Role           `json:"role" gorm:"type:int;"`
	ContributedLocations []Location     `gorm:"foreignKey:ContributedBy;references:UserID"`
	ContributedReview    []Review       `gorm:"foreignKey:ContributedBy;references:UserID"`
	ContributedNotice    []Notice       `gorm:"foreignKey:ContributedBy;references:UserID"`
	ProfilePic           *Image         `gorm:"polymorphic:ParentAsset;" json:"profilepic"` // here the * makes it a pointer and when it is null, it return null in json instead of a default values
	BioPics              []Image        `gorm:"polymorphic:ParentAsset;" json:"biopics"`
}
