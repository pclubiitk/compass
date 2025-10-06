package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Profile struct {
	gorm.Model
	UserID uuid.UUID
	// Student Search Data, Personal Data
	Name       string `json:"name"`
	Email      string `json:"email"`
	RollNo     string `json:"rollNo"`
	Dept       string `json:"dept"`
	Course     string `json:"course"`
	Gender     string `json:"gender"`
	Hall       string `json:"hall"`
	RoomNumber string `json:"roomNo"`
	HomeTown   string `json:"homeTown"`
	Visibility bool   `json:"visibility"`
	Bapu       string `json:"bapu"`
	Bachhas    string `json:"bachhas"`
}

type Action string

const (
	Add    Action = "add"
	Delete Action = "delete"
)

type ChangeLog struct {
	UserID    uuid.UUID `gorm:"primarykey"`
	CreatedAt time.Time `json:"-"`
	Action    Action    `json:"action" gorm:"type:varchar(20);check:action IN ('add','delete')"`
}
