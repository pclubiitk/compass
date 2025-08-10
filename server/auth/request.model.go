package auth

type SignUpRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type ProfileUpdateRequest struct {
	NewPassword *string `json:"password"` // make pointer, so if not in request then null
	// TODO: Add Bio Text
	// TODO: Migrate puppy love profile data like interests,
	// TODO: Change upload / update pp pics, biopics image logic
}
