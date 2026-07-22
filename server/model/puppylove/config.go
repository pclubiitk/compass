package puppylove

import (
	"time"
)

type PuppyLoveConfig struct {
	Key       string    `json:"key" gorm:"primaryKey;type:varchar(100)"`
	Value     string    `json:"value" gorm:"type:text"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

const (
	ConfigKeyPermit           = "puppylove_permit"
	ConfigKeyResultsPublished = "puppylove_results_published"
	ConfigKeyMode             = "puppylove_mode"
)

const (
	DefaultPermit           = "true"
	DefaultResultsPublished = "false"
	DefaultMode             = "inactive"
)
