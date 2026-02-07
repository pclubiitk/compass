package puppylove

import "gorm.io/gorm"

type UserPublicKey struct {
	gorm.Model
	Id   string `json:"_id" bson:"_id" gorm:"unique"`
	PubK string `json:"pubKey" bson:"pubKey"`
}

type UserInfo struct {
	Id        string `json:"_id" grom:"unique"`
	About     string `json:"about" bson:"about"`
	Interests string `json:"interests" bson:"interests"`
}

type AddNewUser struct {
	TypeUserNew []TypeUserNew `json:"newuser" binding:"required"`
}

type TypeUserNew struct {
	Id     string `json:"roll" binding:"required"`
	Name   string `json:"name" binding:"required"`
	Email  string `json:"email" binding:"required"`
	Gender string `json:"gender" binding:"required"`
}

type TypeUserFirst struct {
	Id       string `json:"roll" binding:"required"`
	AuthCode string `json:"authCode" binding:"required"`
	PassHash string `json:"passHash" binding:"required"`
	PubKey   string `json:"pubKey" binding:"required"`
	PrivKey  string `json:"privKey" binding:"required"`
	Data     string `json:"data" binding:"required"`
}

type UserLogin struct {
	Id   string `json:"_id" binding:"required"`
	Pass string `json:"passHash" binding:"required"`
}

type RecoveryCodeReq struct {
	Pass string `json:"passHash" binding:"required"`
	Code string `json:"code" binding:"required"`
}

type RetrivePassReq struct {
	Id string `json:"_id" binding:"required"`
}

type UpdateAboutReq struct {
	About string `json:"about" binding:"required"`
}

type UpdateInterestReq struct {
	Interests string `json:"interests"`
}

type VerifyAccessPasswordReq struct {
	Password string `json:"password" binding:"required"`
}

// TODO: w'll change it later (maybee..)
type AdminLogin struct {
	Id   string `json:"id" binding:"required"`
	Pass string `json:"pass" binding:"required"`
}

type MailData struct {
	Name  string `json:"name" binding:"required"`
	Email string `json:"email" binding:"required"`
	AuthC string `json:"authCode" binding:"required"`
	Dirty bool   `json:"dirty" binding:"required"`
}

type Heart struct {
	SHA_encrypt string `json:"sha_encrypt"`
	Id_encrypt  string `json:"id_encrypt"`
	SongID_enc  string `json:"songID_enc"`
}

type Hearts struct {
	Heart1 Heart `json:"heart1"`
	Heart2 Heart `json:"heart2"`
	Heart3 Heart `json:"heart3"`
	Heart4 Heart `json:"heart4"`
}

type SendHeartVirtual struct {
	Hearts Hearts `json:"hearts"`
}

type SendHeartFirst struct {
	GenderOfSender string             `json:"genderOfSender" binding:"required"`
	ENC1           string             `json:"enc1" binding:"required"`
	SHA1           string             `json:"sha1" binding:"required"`
	SONG1          string             `json:"song1_enc"`
	ENC2           string             `json:"enc2"`
	SHA2           string             `json:"sha2"`
	SONG2          string             `json:"song2_enc"`
	ENC3           string             `json:"enc3"`
	SHA3           string             `json:"sha3"`
	SONG3          string             `json:"song3_enc"`
	ENC4           string             `json:"enc4"`
	SHA4           string             `json:"sha4"`
	SONG4          string             `json:"song4_enc"`
	ReturnHearts   []VerifyHeartClaim `json:"returnhearts"`
}

type VerifyHeartClaim struct {
	Enc            string `json:"enc" binding:"required"`
	SHA            string `json:"sha" binding:"required"`
	SONG_ENC       string `json:"songID_enc" bson:"song"`
	GenderOfSender string `json:"genderOfSender" binding:"required"`
}

type VerifyReturnHeartClaim struct {
	Enc    string `json:"enc" binding:"required"`
	Secret string `json:"secret" binding:"required"`
}

type FetchHeartsFirst struct {
	Enc            string `json:"enc"`
	GenderOfSender string `json:"genderOfSender"`
}
type FetchReturnedHearts struct {
	SHA string `json:"sha"`
	Enc string `json:"enc"`
}
type SentHeartsDecoded struct {
	DecodedHearts []FetchHeartsFirst `json:"decodedHearts" binding:"required"`
}

type UserReturnHearts struct {
	ReturnHearts []UserReturnHeart `json:"returnhearts" binding:"required"`
}

type UserReturnHeart struct {
	ENC      string `json:"enc" binding:"required" gorm:"unique"`
	SHA      string `json:"sha" binding:"required" gorm:"unique"`
	SONG_ENC string `json:"songID_enc" bson:"song"`
}

type FetchReturnHeart struct {
	ENC string `json:"enc" binding:"required" gorm:"unique"`
}

var (
	StatsFlag       = true
	FemaleRegisters = 0
	MaleRegisters   = 0
	NumberOfMatches = 0
	RegisterMap     = make(map[string]int)
	MatchMap        = make(map[string]int)
)
