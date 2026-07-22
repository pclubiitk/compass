// TODO: IN all the models, set yp the required indexing for faster search
// TODO: https://gorm.io/docs/indexes.html

package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Image struct {
    CreatedAt       time.Time      `json:"-"`
    UpdatedAt       time.Time      `json:"-"`
    DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
    ImageID         uuid.UUID      `json:"imageId" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
    OwnerID         uuid.UUID      `gorm:"index" json:"ownerId"`
    ParentAssetID   uuid.UUID      `json:"parentAssetId"`
    ParentAssetType string         `json:"parentAssetType"`
    Status          Status         `gorm:"type:varchar(20);check:status IN ('pending','approved','rejected','rejectedByBot')" json:"status"`
    Submitted       bool           `json:"-"`
}
