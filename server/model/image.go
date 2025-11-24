// TODO: IN all the models, set yp the required indexing for faster search
// TODO: https://gorm.io/docs/indexes.html

package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Image struct {
	// TODO: Write the logic to clear older images, having Submitted false
	CreatedAt       time.Time      `json:"-"`
	UpdatedAt       time.Time      `json:"-"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
	ImageID         uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	OwnerID         uuid.UUID      `gorm:"index"`
	ParentAssetID   *uuid.UUID     `gorm:"index"`
	ParentAssetType string         `gorm:"index"`
	Status          Status         `gorm:"type:varchar(20);check:status IN ('pending','approved','rejected','rejectedByBot');index"`
	Submitted       bool           `json:"-" gorm:"index"`
}
