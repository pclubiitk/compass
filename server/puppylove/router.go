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

		users := puppylove.Group("/users")
		{
			users.Use(middleware.UserAuthenticator)
			users.GET("/alluserInfo", GetAllUsersInfo)
			users.POST("/login/first", UserFirstLogin)
		
			users.GET("/data", GetUserData)
			users.GET("/activeusers", GetActiveUsers)
			users.GET("/fetchPublicKeys", FetchPublicKeys)
			users.GET("/fetchReturnHearts", FetchReturnHearts)

			users.POST("/verify-password", VerifyAccessPassword)

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

		// Public endpoints
		puppylove.GET("/stats", GetStats)
		puppylove.GET("/publickeys", FetchPublicKeys)

		// Protected endpoints (require authentication)
		protected := puppylove.Group("")
		protected.Use(middleware.UserAuthenticator)
		{
			protected.GET("/hearts", FetchHearts)
			protected.GET("/returnhearts", FetchReturnHearts)
			protected.POST("/hearts/decoded", SentHeartDecoded)
		}
	}
}
