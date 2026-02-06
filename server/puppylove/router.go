package puppylove

import (
	"compass/middleware"
	"github.com/gin-gonic/gin"
)

func Router(r *gin.Engine) {
	puppylove := r.Group("/api/puppylove")
	{
		puppylove.GET("/", func(c *gin.Context) {
			c.JSON(200, gin.H{"message": "Hello from the other side."})
		})
		puppylove.GET("/stats", GetStats)

		users := puppylove.Group("/users")
		{
			users.Use(middleware.UserAuthenticator)
			users.GET("/alluserInfo", GetAllUsersInfo)
			users.POST("/login/first", UserFirstLogin)

			users.Use(middleware.UserAuthenticator)
			// users.POST("/addRecovery", addRecovery)   not added recovery method in migrated version yet
			users.GET("/data", GetUserData)
			users.GET("/activeusers", GetActiveUsers)
			users.GET("/fetchPublicKeys", FetchPublicKeys)
			users.GET("/fetchReturnHearts", FetchReturnHearts)

			users.POST("/about", UpdateAbout)
			users.POST("/interests", UpdateInterest)

			users.POST("/verifyreturnhearts", VerifyReturnHeartHandler)
			users.GET("/fetchall", FetchHearts)
			users.POST("/sentHeartDecoded", SentHeartDecoded)
			users.POST("/claimheart", HeartClaimHandler)

			users.POST("/publish", PublishProfile)
			users.GET("/mymatches", MatchesHandler)

			users.Use(PuppyLovePermit())
			users.POST("/sendheartVirtual", SendHeartVirtualHandler)
			users.POST("/sendheart", SendHeartWithReturn)

		}
		late := r.Group("/special")
		{
			late.Use(middleware.UserAuthenticator)
			users.Use(PuppyLovePermit())
			late.POST("/returnclaimedheartlate", ReturnClaimedHeartLate)
		}
		// for logout, we can directly use the compass' logoutHandler at /logout
		
		// session := r.Group("/session")
		// {
		// 	session.POST("/admin/login", controllers.AdminLogin)
		// 	// session.POST("/login", controllers.UserLogin)
		// 	session.GET("/logout", controllers.UserLogout)
		// }

	}
}
