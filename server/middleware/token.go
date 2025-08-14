package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func GenerateToken(userID uuid.UUID, role int, verified bool) (string, error) {
	claims := JWTClaims{
		UserID: userID,
		Role:   role,
		Verified: verified,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(authConfig.TokenExpiration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "pclub",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(authConfig.JWTSecretKey))
}

func SetAuthCookie(c *gin.Context, token string) {
	c.SetSameSite(authConfig.SameSiteMode)
	c.SetCookie(
		"auth_token",
		token,
		int(authConfig.TokenExpiration.Seconds()),
		"/",
		authConfig.CookieDomain,
		authConfig.CookieSecure,
		authConfig.CookieHTTPOnly,
	)
}
func ClearAuthCookie(c *gin.Context) {
	c.SetSameSite(authConfig.SameSiteMode)
	c.SetCookie(
		"auth_token",
		"",
		-1,
		"/",
		authConfig.CookieDomain,
		authConfig.CookieSecure,
		authConfig.CookieHTTPOnly,
	)
}
