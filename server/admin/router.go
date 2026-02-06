package admin

import (
	"compass/middleware"

	"github.com/gin-gonic/gin"
)

// Router initializes admin routes
func Router(r *gin.Engine) {
	adminGroup := r.Group("/api/admin")
	{
		// Admin only routes (accessible to both Admin and SuperAdmin)
		adminGroup.Use(middleware.UserAuthenticator, middleware.AdminAuthenticator)

		// Make a user admin (SuperAdmin only - checked in handler)
		adminGroup.POST("/make-admin", makeAdminHandler)

		// List all admins (Admin and SuperAdmin)
		adminGroup.GET("/list", listAdminsHandler)

		// Demote an admin back to user (SuperAdmin only - checked in handler)
		adminGroup.POST("/remove-admin", demoteAdminHandler)
	}
}
