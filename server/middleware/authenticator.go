package middleware

import (
	"compass/model"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/spf13/viper"
)

var authConfig = AuthConfig{
	JWTSecretKey:    viper.GetString("jwt.secret"),
	TokenExpiration: 24 * time.Hour,
	CookieDomain:    viper.GetString("domain"),
	CookieSecure:    false, // Set to false in development
	CookieHTTPOnly:  true,  // Prevent XSS
	SameSiteMode:    http.SameSiteLaxMode,
}

func UserAuthenticator(c *gin.Context) {
	// Check for cookie
	tokenString, err := c.Cookie("token")
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	// extract token
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(authConfig.JWTSecretKey), nil
	})
	if err != nil || !token.Valid {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}
	// Type conversion to *JWTClaims
	claims, ok := token.Claims.(*JWTClaims)
	if !ok {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		return
	}
	// Set the user role here
	c.Set("userID", claims.UserID)
	c.Set("userRole", claims.Role)
	c.Next()
}

func AdminAuthenticator(c *gin.Context) {
	// UserAuthenticator to get the userid and role in the request
	UserAuthenticator(c)
	// verify the role
	if role, exist := c.Get("userRole"); !exist || role != model.AdminRole {
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			return
	}
	c.Next()
}

// TODO: Visitors Auth System
