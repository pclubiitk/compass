package model

import "gorm.io/gorm"

type Logs struct {
	gorm.Model
	LogId           string `gorm:"uniqueIndex" json:"log_id"`
	Title           string `json:"title" binding:"required"`
	Description     string `json:"description"`
	ActionTaker Role   `gorm:"type:varchar(10);check:action_taker IN ('admin','bot','user')"`
}
