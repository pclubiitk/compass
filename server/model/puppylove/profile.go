package puppylove

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type PuppyLoveProfile struct {
	UserID    uuid.UUID `json:"-" gorm:"type:uuid;primaryKey"`
	RollNo    string    `json:"rollNo" gorm:"type:varchar(20);index"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Gender string `json:"gender" gorm:"type:varchar(10);index"`

	PubK  string `json:"pubKey" bson:"pubKey"`
	PrivK string `json:"-" bson:"privKey"`

	Data    string          `json:"data" bson:"data"`
	Claims  string          `json:"claims" bson:"claims"`
	Submit  bool            `json:"submitted" bson:"submitted"`
	Matches json.RawMessage `gorm:"type:jsonb" json:"matches" bson:"matches"`
	Dirty   bool            `json:"dirty" bson:"dirty"`
	Publish bool            `json:"publish" bson:"publish"`

	About                 string    `json:"about" bson:"about"`
	Interests             string    `json:"interests" bson:"interests"`
	SendHeartsTimestamp   time.Time `json:"send_hearts_timestamp" bson:"send_hearts_timestamp"`
	ReturnHeartsTimestamp time.Time `json:"return_hearts_timestamp" bson:"return_hearts_timestamp"`
}
