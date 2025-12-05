package auth

type LoginSignupRequest struct {
	Email    string `form:"email" binding:"required,email"`
	Password string `form:"password" binding:"required,min=8"`
	// FOR DEV: BYPASS
	Token string `json:"token" binding:"required"`
}

type UpdatePasswordRequest struct {
	NewPassword string `json:"password"`
}

type RecaptchaResponse struct {
	// Output json struct from of https://www.google.com/recaptcha/api/siteverify
	Success     bool     `json:"success"`      // whether this request was a valid reCAPTCHA token for your site
	Score       float64  `json:"score"`        // the score for this request (0.0 - 1.0)
	Action      string   `json:"action"`       // the action name for this request (important to verify)
	ChallengeTS string   `json:"challenge_ts"` // timestamp of the challenge load (ISO format yyyy-MM-dd'T'HH:mm:ssZZ)
	Hostname    string   `json:"hostname"`     // the hostname of the site where the reCAPTCHA was solved
	ErrorCodes  []string `json:"error-codes"`  // optional
}

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

type CCResponse struct {
	RollNumber *string `json:"rollNumber"`
	Name       *string `json:"name"`
	Email      *string `json:"email"`
	Status     *string `json:"status"`
	Timestamp  *string `json:"timestamp"`
	Message    *string `json:"message"`
}

type StudentDetails struct {
	RollNo     string `json:"roll_no"`
	Name       string `json:"name"`
	Program    string `json:"program"`
	Department string `json:"department"`
	Gender     string `json:"gender"`
	HostelInfo string `json:"hostel_info"`
	Username   string `json:"username"`
	BloodGroup string `json:"blood_group"`
	Location   string `json:"location"`
}