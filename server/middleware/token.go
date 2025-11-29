package middleware

import (
	"compass/connections"
	"compass/model"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)




func GenerateRefreshToken(userID uuid.UUID) (string, error) {
claims := JWTClaims{
		UserID:   userID,
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

func GenerateAccessToken(userID uuid.UUID) (string, error) {

	var modelUser model.User
	result := connections.DB.Model(&model.User{}).Select("role", "is_verified", "visibility").
		Where("user_id = ?", userID).First(&modelUser)
	
	if result.Error != nil {
		return "", result.Error
	}
	// Ideally fetch role + verified from DB
	role := int(modelUser.Role)
	verified := modelUser.IsVerified
	visibility := modelUser.Profile.Visibility
	



	claims := JWTClaims{
		UserID:   userID,
		Role:     role,
		Verified: verified,
		Visibility: visibility,
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

func SetRefreshCookie(c *gin.Context, token string) {
	c.SetSameSite(authConfig.SameSiteMode)
	c.SetCookie(
		"refresh_token",
		token,
		int(authConfig.RefreshTokenExpiry.Seconds()),
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
	c.SetCookie(
		"refresh_token",
		"",
		-1,
		"/",
		authConfig.CookieDomain,
		authConfig.CookieSecure,
		authConfig.CookieHTTPOnly,
	)
}
