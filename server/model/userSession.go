package model

import (
	"time"

	"github.com/google/uuid"
)

type UserRefreshToken struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	UserID    uuid.UUID `gorm:"type:uuid;index;not null"`
	Token     string    `gorm:"type:text;uniqueIndex;not null"`
	ExpiresAt time.Time `gorm:"index;not null"`
	CreatedAt time.Time
}
