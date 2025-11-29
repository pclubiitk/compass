package middleware

import (
	"compass/connections"
	"compass/model"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/spf13/viper"
)

var authConfig = AuthConfig{
	JWTSecretKey:    viper.GetString("jwt.secret"),
	TokenExpiration: 5 * time.Minute,
	RefreshTokenExpiry: 24 * 7 * time.Hour, // 7 days
	CookieDomain:    viper.GetString("domain"),
	CookieSecure:    false, // Set to false in development
	CookieHTTPOnly:  true,  // Prevent XSS
	SameSiteMode:    http.SameSiteLaxMode,
}

// TODO: Extract the basic token extraction and verification out and keep just the user part
func UserAuthenticator(c *gin.Context) {
	// Check for cookie
	tokenString, err := c.Cookie("auth_token")
	if err != nil {
		tryRefresh(c)
	
		return
	}
	// extract token
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(authConfig.JWTSecretKey), nil
	})
	if err != nil || !token.Valid {
	tryRefresh(c)
		return
	}
	// Type conversion to *JWTClaims
	claims, ok := token.Claims.(*JWTClaims)
	if !ok {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		return
	}
	// Set the role here
	// TODO: Find better way, here whenever i extract i need to do a check if that thing exist or not
	c.Set("userID", claims.UserID)
	c.Set("userRole", claims.Role)
	c.Set("verified", claims.Verified)
	c.Set("visibility", claims.Visibility)

	// Verify the user power
	if role := c.GetInt("userRole"); role < int(model.UserRole) {
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}
	c.Next()
}
func tryRefresh(c *gin.Context) {
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Parse refresh token
	token, err := jwt.Parse(refreshToken, func(token *jwt.Token) (interface{}, error) {
		return []byte(authConfig.JWTSecretKey), nil
	})
	if err != nil || !token.Valid {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}

	// claims, ok := token.Claims.(jwt.MapClaims)
	// if !ok {
	// 	c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token claims"})
	// 	return
	// }


	claims, ok := token.Claims.(*JWTClaims)
if !ok {
	c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
	return
}

	userID, err := uuid.Parse(claims.UserID.String())
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}


	//fetch user details from db

	var modelUser model.User
	result := connections.DB.Model(&model.User{}).Select("role", "is_verified", "visibility").
		Where("user_id = ?", userID).First(&modelUser)
	
	if result.Error != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	// Ideally fetch role + verified from DB
	role := int(modelUser.Role)
	verified := modelUser.IsVerified
	visibility := modelUser.Profile.Visibility

	//geneate new access token
	newAccessToken, err := GenerateAccessToken(userID)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate access token"})
		return
	}
	SetAuthCookie(c, newAccessToken)
	// Set context values


	c.Set("userID", userID)
	c.Set("userRole", role)
	c.Set("verified", verified)
	c.Set("visibility", visibility)

	c.Next()
}


func AdminAuthenticator(c *gin.Context) {
	// verify the role
	if role := c.GetInt("userRole"); role < int(model.AdminRole) {
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}
	c.Next()
}

// But once the user verifies the email, the cookie will remain same hence will need to login again
// TODO: I can fetch db and check if it is false and update it
func EmailVerified(c *gin.Context) {
	// verified email ?
	verified, exist := c.Get("verified")
	if !exist {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized here"})
		return
	}
	if !verified.(bool) {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Please verify your email to continue"})
		return
	}
	// TODO: implement the refresh the token, can remove this then, as the token will not have the verification update
	// ClearAuthCookie(c)
	c.Next()
}

// TODO: Visitors Auth System, Need to define exact permission
