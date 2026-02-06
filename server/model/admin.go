package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Admin struct {
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	AdminID uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"adminId"`
	Email   string    `gorm:"index" json:"email"`
	Name    string    `json:"name"`
	RollNo  string    `json:"rollNo"`
}

// TableName specifies the table name for the Admin model
func (Admin) TableName() string {
	return "admins"
}
