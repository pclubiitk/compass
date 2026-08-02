package middleware

import (
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// JWTClaims custom claims structure
type JWTClaims struct {
	UserID     uuid.UUID `json:"user_id"`
	RollNo     string    `json:"roll_no"`
	Role       int       `json:"role"`
	Verified   bool      `json:"verified"`
	Visibility bool      `json:"visibility"`
	TokenType  string    `json:"token_type"`
	jwt.RegisteredClaims
}

func NewAccessTokenClaims(userID uuid.UUID, role int, verified bool, visibility bool) JWTClaims {
	return JWTClaims{
		UserID:     userID,
		Role:       role,
		Verified:   verified,
		Visibility: visibility,
		TokenType:  "access",
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(5 * time.Minute)),
			Issuer:    "pclub",
		},
	}
}

type JWTClaimsRefresh struct {
	UserID    string `json:"user_id"`
	TokenType string `json:"token_type"`
	jwt.RegisteredClaims
}

func NewRefreshTokenClaims(userID uuid.UUID, expiry time.Duration) JWTClaimsRefresh {
	return JWTClaimsRefresh{
		UserID:    userID.String(),
		TokenType: "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			Issuer:    "pclub",
		},
	}
}

// AuthConfig holds authentication configuration
type AuthConfig struct {
	JWTSecretKey       string
	TokenExpiration    time.Duration
	RefreshTokenExpiry time.Duration
	CookieDomain       string
	CookieSecure       bool
	CookieHTTPOnly     bool
	SameSiteMode       http.SameSite
}
