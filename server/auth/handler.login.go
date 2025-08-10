package auth

import (
	"compass/connections"
	"compass/middleware"
	"compass/model"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func loginHandler(c *gin.Context) {
	var req LoginRequest
	var dbUser model.User
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}
	// TODO: If the user is already logged in ?
	result := connections.DB.Select("email", "user_id", "password", "role").Where("email = ?", req.Email).First(&dbUser)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User Not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": ""})
		}
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(dbUser.Password), []byte(req.Password)); err != nil {
		middleware.ClearAuthCookie(c)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}
	// create a valid jwt token
	token, err := middleware.GenerateToken(dbUser.UserID, string(dbUser.Role))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}
	// set cookie
	middleware.SetAuthCookie(c, token)
	c.JSON(http.StatusOK, gin.H{"message": "Login Successful"})
}
