package auth

type SignUpRequest struct {
	// Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required,min=8"`
}

type LoginRequest struct {
	Email    string `form:"email" binding:"required,email"`
	Password string `form:"password" binding:"required,min=8"`
}

type UpdatePasswordRequest struct {
	NewPassword string `json:"password"`
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
