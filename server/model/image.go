package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Image struct {
	CreatedAt time.Time      `json:"-"`
	UpdatedAt time.Time      `json:"-"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	ImageID   uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	OwnerID   uuid.UUID      `gorm:"index"`
	OwnerType string         `gorm:"index"`
	Path      string         `json:"path" binding:"required"`
	Approved  bool           `json:"-"`
	Submitted bool           `json:"-"`
}
