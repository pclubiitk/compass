package auth

type SignUpRequest struct {
	// Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required,min=8"`
	Token    string `json:"token" binding:"required"`
}

type LoginRequest struct {
	Email    string `form:"email" binding:"required,email"`
	Password string `form:"password" binding:"required,min=8"`
	Token    string `json:"token" binding:"required"`
}

type UpdatePasswordRequest struct {
	NewPassword string `json:"password"`
}

type RecaptchaResponse struct { //similar to the output json of https://www.google.com/recaptcha/api/siteverify as given below
	Success     bool    `json:"success"`
	Score       float64 `json:"score"`
	Action      string  `json:"action"`
	ChallengeTS string  `json:"challenge_ts"`
	Hostname    string  `json:"hostname"`
	ErrorCodes  []string `json:"error-codes"`
}
// {
//   "success": true|false,      // whether this request was a valid reCAPTCHA token for your site
//   "score": number             // the score for this request (0.0 - 1.0)
//   "action": string            // the action name for this request (important to verify)
//   "challenge_ts": timestamp,  // timestamp of the challenge load (ISO format yyyy-MM-dd'T'HH:mm:ssZZ)
//   "hostname": string,         // the hostname of the site where the reCAPTCHA was solved
//   "error-codes": [...]        // optional
// }


type ProfileUpdateRequest struct {
	Name       string `json:"name"`
	RollNo     string `json:"rollNo"`
	Dept       string `json:"dept"`
	Course     string `json:"course"`
	Gender     string `json:"gender"`
	Hall       string `json:"hall"`
	RoomNumber string `json:"roomNo"`
	HomeTown   string `json:"homeTown"`
}

