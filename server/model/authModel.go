// Define structs like User, global to all
package model

import "gorm.io/gorm"

type Role string

const (
	AdminRole Role = "admin"
	Bot       Role = "bot"
	UserRole  Role = "user"
)

type User struct {
	gorm.Model
	UserID               string     `gorm:"uniqueIndex" json:"user_id"`
	Email                string     `json:"email"`
	Password             string     `json:"password"`
	Name                 string     `json:"name"`
	IsVerified           bool       `json:"is_verified"`
	VerificationToken    string     `json:"-"` //erased after verification
	Role                 Role       `gorm:"type:varchar(10);check:role IN ('admin','bot','user')"`
	ContributedLocations []Location `gorm:"foreignKey:ContributedBy;references:UserID"`
	ContributedReview    []Review   `gorm:"foreignKey:ContributedBy;references:UserID"`
}
