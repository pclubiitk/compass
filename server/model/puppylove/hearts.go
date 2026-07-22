package puppylove

import (
	"gorm.io/gorm"
)

// SendHeart represents a heart sent from one user to another
type (
	SendHeart struct {
		gorm.Model
		SHA            string `json:"sha" bson:"sha" gorm:"unique"`
		ENC            string `json:"enc" bson:"enc" gorm:"unique"`
		SONG_ENC       string `json:"songID_enc" bson:"song"`
		GenderOfSender string `json:"genderOfSender" bson:"gender"`
	}
)


type (
	HeartClaims struct {
		gorm.Model
		Id       string `json:"enc" bson:"enc" gorm:"unique"`
		SHA      string `json:"sha" bson:"sha" gorm:"unique"`
		RollNo     string `json:"roll_no" bson:"roll_no"`
		SONG_ENC string `json:"songID_enc" bson:"song"`
	}
)

type (
	ReturnHearts struct {
		gorm.Model
		SHA      string `json:"sha" bson:"sha"`
		ENC      string `json:"enc" bson:"enc" gorm:"unique"`
		SONG_ENC string `json:"songID_enc" bson:"song"`
	}
)


type (
	MatchTable struct {
		gorm.Model
		Roll1  string `json:"roll1" bson:"roll1"`
		Roll2  string `json:"roll2" bson:"roll2"`
		SONG12 string `bson:"song12"`
		SONG21 string `bson:"song21"`
	}
)

