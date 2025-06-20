package auth

type SignUpRequest struct {
	UserID   string `json:"user_id" binding:"required"`
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginRequest struct {
	// complete it accordingly
}