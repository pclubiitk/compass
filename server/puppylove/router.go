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
		// Public endpoints

		users := puppylove.Group("/users")
		{
			users.Use(middleware.UserAuthenticator)
			users.GET("/alluserInfo", GetAllUsersInfo)
			users.POST("/login/first", UserFirstLogin)

			users.POST("/addRecovery", AddRecovery)
			users.GET("/retrieve", RetrievePass)
			users.GET("/data", GetUserData)
			users.GET("/activeusers", GetActiveUsers)

			users.GET("/fetchPublicKeys", FetchPublicKeys)

			users.GET("/fetchReturnHearts", FetchReturnHearts)

			// TODO: check it
			users.POST("/verify-password", VerifyAccessPassword)

			users.POST("/about", UpdateAbout)
			users.POST("/interests", UpdateInterest)

			users.POST("/verifyreturnhearts", VerifyReturnHeartHandler)

			users.GET("/fetchall", FetchHearts)

			// TODO: combine this
			users.POST("/hearts/decoded", SentHeartDecoded)
			users.POST("/sentHeartDecoded", SentHeartDecoded)
			users.POST("/claimheart", HeartClaimHandler)

			users.POST("/publish", PublishProfile)
			users.GET("/mymatches", MatchesHandler)

			users.Use(PuppyLovePermit())
			users.POST("/sendheartVirtual", SendHeartVirtualHandler)
			users.POST("/sendheart", SendHeartWithReturn)

		}
		late := puppylove.Group("/special")
		{
			late.Use(middleware.UserAuthenticator)
			users.Use(PuppyLovePermit())
			late.POST("/returnclaimedheartlate", ReturnClaimedHeartLate)
		}

		admin := puppylove.Group("/admin")
		{
			admin.Use(middleware.UserAuthenticator, middleware.PuppyLoveAdminAuthenticator)
			admin.GET("/publish", PublishResults)
			admin.GET("/togglepermit", TogglePermit)
		}

	}
}
