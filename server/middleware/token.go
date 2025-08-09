package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func GenerateToken(userID uuid.UUID, role string) (string, error) {
	claims := JWTClaims{
		UserID: userID,
		Role:   role,
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

func VerifyToken() {

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
