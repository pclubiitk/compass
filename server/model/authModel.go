// Define structs like User, global to all
package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Role string

const (
	AdminRole Role = "admin"
	Bot       Role = "bot"
	UserRole  Role = "user"
)

type User struct {
	CreatedAt            time.Time
	UpdatedAt            time.Time
	DeletedAt            gorm.DeletedAt `gorm:"index"`
	UserID               uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Email                string         `gorm:"unique" json:"email"`
	Password             string         `json:"password"`
	Name                 string         `json:"name"`
	IsVerified           bool           `json:"is_verified"`
	VerificationToken    string         `json:"-"` //erased after verification
	Role                 Role           `json:"role" gorm:"type:varchar(10);check:role IN ('admin','bot','user')"`
	ContributedLocations []Location     `gorm:"foreignKey:ContributedBy;references:UserID"`
	ContributedReview    []Review       `gorm:"foreignKey:ContributedBy;references:UserID"`
}
