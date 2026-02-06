package admin

import (
	"compass/connections"
	"compass/model"
	"compass/workers"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type MakeAdminRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// makeAdminHandler promotes a user to admin role (super admin only)
func makeAdminHandler(c *gin.Context) {
	// Check if user is super admin
	userRole, exists := c.Get("userRole")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized - no role found"})
		return
	}

	role, ok := userRole.(int)
	if !ok {
		logrus.Errorf("Invalid role type in context: %T", userRole)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid role type"})
		return
	}

	// Only super admins (role 101) can make admins
	if role != int(model.SuperAdminRole) {
		logrus.Infof("User with role %d tried to promote user to admin", role)
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Only super admins can promote users to admin",
			"userRole": role,
			"requiredRole": int(model.SuperAdminRole),
		})
		return
	}

	var req MakeAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Fetch the user to get their details
	var user model.User
	if err := connections.DB.
		Where("email = ?", req.Email).
		Preload("Profile").
		First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		logrus.WithError(err).Error("Database error fetching user")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Check if user is already an admin or super admin
	if user.Role == model.AdminRole || user.Role == model.SuperAdminRole {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User is already an admin or super admin"})
		return
	}

	// No separate admins table used anymore; roles are stored on the users table

	// Verify Profile is loaded
	if user.Profile.Name == "" {
		logrus.Error("User profile not loaded properly")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User profile data incomplete"})
		return
	}

	// Promote user to admin role
	if err := connections.DB.Transaction(func(tx *gorm.DB) error {
		// Update user role to admin
		if err := tx.Model(&user).Update("role", model.AdminRole).Error; err != nil {
			logrus.WithError(err).Error("Failed to update user role")
			return err
		}

		return nil
	}); err != nil {
		logrus.WithError(err).Error("Failed to promote user to admin")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to promote user to admin: " + err.Error()})
		return
	}

	// Send email notification to the new admin
	job := workers.MailJob{
		Type: "make_admin",
		To:   user.Email,
		Data: map[string]interface{}{
			"name": user.Profile.Name,
		},
	}

	payload, _ := json.Marshal(job)
	if err := workers.PublishJob(payload, model.MailQueue); err != nil {
		logrus.WithError(err).Error("Failed to enqueue admin promotion email")
		// Don't fail the request if email fails to enqueue
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User promoted to admin successfully",
		"email":   req.Email,
		"name":    user.Profile.Name,
	})
}

type AdminListResponse struct {
	Email   string `json:"email"`
	Name    string `json:"name"`
	RollNo  string `json:"rollNo"`
	AdminID string `json:"adminId"`
	Role    int    `json:"role"`
}

// listAdminsHandler returns super admins first, then regular admins from the admins table
func listAdminsHandler(c *gin.Context) {
	// Fetch all users that are admins or super admins, super admins first
	var admins []model.User
	if err := connections.DB.
		Where("role IN ?", []model.Role{model.SuperAdminRole, model.AdminRole}).
		Preload("Profile").
		Order("role DESC").
		Find(&admins).Error; err != nil {
		logrus.WithError(err).Error("Database error fetching admins from users table")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	logrus.Infof("Found %d admins (including super admins) in users table", len(admins))

	// Convert to response format - super admins first due to ordering
	response := make([]AdminListResponse, 0, len(admins))

	for _, u := range admins {
		response = append(response, AdminListResponse{
			Email:   u.Email,
			Name:    u.Profile.Name,
			RollNo:  u.Profile.RollNo,
			AdminID: u.UserID.String(),
			Role:    int(u.Role),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"admins": response,
		"total":  len(response),
	})
}

type DemoteAdminRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// demoteAdminHandler demotes an admin back to regular user (super admin only)
func demoteAdminHandler(c *gin.Context) {
	// Check if user is super admin
	userRole, exists := c.Get("userRole")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	role, ok := userRole.(int)
	if !ok || role != int(model.SuperAdminRole) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only super admins can demote admins"})
		return
	}

	var req DemoteAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Fetch the user to demote
	var user model.User
	if err := connections.DB.
		Where("email = ?", req.Email).
		First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		logrus.WithError(err).Error("Database error fetching user")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Demote user from admin back to regular user
	if err := connections.DB.Transaction(func(tx *gorm.DB) error {
		// Update user role back to regular user
		if err := tx.Model(&user).Update("role", model.UserRole).Error; err != nil {
			return err
		}

		// No admins table to delete from; roles are maintained on users table only
		return nil
	}); err != nil {
		logrus.WithError(err).Error("Failed to demote admin")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to demote admin"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Admin demoted successfully",
		"email":   req.Email,
	})
}

