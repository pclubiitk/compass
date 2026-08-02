package middleware

import (
	"compass/connections"
	"compass/model"
	"crypto/sha256"
	"encoding/hex"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func GenerateRefreshToken(userID uuid.UUID) (string, error) {
	claims := NewRefreshTokenClaims(userID, authConfig.RefreshTokenExpiry)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(authConfig.JWTSecretKey))
}

func hashRefreshToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func SaveRefreshToken(userID uuid.UUID, token string) error {
	return connections.DB.Create(&model.UserRefreshToken{
		UserID:    userID,
		Token:     hashRefreshToken(token),
		ExpiresAt: time.Now().Add(authConfig.RefreshTokenExpiry),
	}).Error
}

func RevokeRefreshToken(token string) error {
	if token == "" {
		return nil
	}
	return connections.DB.Model(&model.UserRefreshToken{}).
		Where("token = ?", hashRefreshToken(token)).
		Update("is_active", false).Error
}

func IsRefreshTokenActive(token string) (uuid.UUID, error) {
	var session model.UserRefreshToken
	err := connections.DB.
		Where("token = ? AND expires_at > ? AND is_active = ?", hashRefreshToken(token), time.Now(), true).
		First(&session).Error
	if err != nil {
		return uuid.Nil, err
	}
	return session.UserID, nil
}

func IssueRefreshToken(userID uuid.UUID) (string, error) {
	token, err := GenerateRefreshToken(userID)
	if err != nil {
		return "", err
	}
	if err := SaveRefreshToken(userID, token); err != nil {
		return "", err
	}
	return token, nil
}

func RevokeSession(c *gin.Context) {
	if refreshToken, err := c.Cookie("refresh_token"); err == nil {
		_ = RevokeRefreshToken(refreshToken)
	}
	ClearAuthCookie(c)
}

func GenerateAccessToken(userID uuid.UUID) (string, error) {

	var modelUser model.User
	result := connections.DB.
		Model(&model.User{}).
		// Here we need to keep the user_id in the select query for a very specific reason, if we don't have them the query can't join it with the profile table and we will always have the visibility false
		Select("user_id", "role", "is_verified").
		Preload("Profile", func(db *gorm.DB) *gorm.DB {
			return db.Select("user_id", "visibility", "roll_no")
		}).
		Where("user_id = ?", userID).
		First(&modelUser)

	if result.Error != nil {
		return "", result.Error
	}

	role := int(modelUser.Role)
	verified := modelUser.IsVerified
	visibility := modelUser.Profile.Visibility

	claims := NewAccessTokenClaims(userID, role, verified, visibility)
	claims.RollNo = modelUser.Profile.RollNo
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

	csrfToken := uuid.New().String()
	c.SetCookie(
		"csrf_token",
		csrfToken,
		int(authConfig.TokenExpiration.Seconds()),
		"/",
		authConfig.CookieDomain,
		authConfig.CookieSecure,
		false,
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
	c.SetCookie(
		"csrf_token",
		"",
		-1,
		"/",
		authConfig.CookieDomain,
		authConfig.CookieSecure,
		false,
	)
}
