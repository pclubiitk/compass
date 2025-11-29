package middleware

import (
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// JWTClaims custom claims structure
type JWTClaims struct {
	UserID   uuid.UUID `json:"user_id"`
	Role     int       `json:"role"`
	Verified bool      `json:"verified"`
	Visibility bool    `json:"visibility"`
	jwt.RegisteredClaims
}

// AuthConfig holds authentication configuration
type AuthConfig struct {
	JWTSecretKey    string
	TokenExpiration time.Duration
	RefreshTokenExpiry time.Duration
	CookieDomain    string
	CookieSecure    bool
	CookieHTTPOnly  bool
	SameSiteMode    http.SameSite
}
