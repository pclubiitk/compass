package puppylove

import (
	"time"

	"github.com/google/uuid"
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
		Roll     string `json:"roll"`
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

// Claim represents a heart claim
type Claim struct {
	gorm.Model
	ID        uint      `gorm:"primaryKey"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;index"`
	ClaimedID uuid.UUID `json:"claimed_id" gorm:"type:uuid"`
	SHA       string    `json:"sha" gorm:"type:text"`
	ENC       string    `json:"enc" gorm:"type:text"`
	Verified  bool      `json:"verified" gorm:"default:false"`
	CreatedAt time.Time `json:"created_at"`
}

type (
	MatchTable struct {
		gorm.Model
		Roll1  string `json:"roll1" bson:"roll1"`
		Roll2  string `json:"roll2" bson:"roll2"`
		SONG12 string `bson:"song12"`
		SONG21 string `bson:"song21"`
	}
)

