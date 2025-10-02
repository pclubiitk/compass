package model

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Profile struct {
	gorm.Model
	UserID uuid.UUID
	// Student Search Data, Personal Data
	Name                 string `json:"name"`
	Email                string `json:"email"`
	RollNo               string `json:"rollNo"`
	Dept                 string `json:"dept"`
	Course               string `json:"course"`
	Gender               string `json:"gender"`
	Hall                 string `json:"hall"`
	RoomNumber           string `json:"roomNo"`
	HomeTown             string `json:"homeTown"`
	PersonalDataVerified bool   `json:"-"`
}

type ChangeLog struct {
	gorm.Model
	RollNo   string `json:"rollNo" binding:"required"`
	IsPublic bool   `json:"isPublic" binding:"required"`
}
