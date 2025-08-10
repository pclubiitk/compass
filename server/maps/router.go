// Define routes like /directions, /location, etc.
package maps

import (
	"compass/middleware"

	"github.com/gin-gonic/gin"
)

func Router(r *gin.Engine) {
	maps := r.Group("/api/maps")
	{
		// Public routes, will not require login, static data providers
		// use https://gin-gonic.com/en/docs/examples/param-in-path/ and structure the paths to support specific id, and pagination
		maps.GET("/notice/:page", noticeProvider)         // each page will provide 10 notices (all the details about the notices)
		maps.GET("/location/:id", locationDetailProvider) // provide exact details about the location using the id
		maps.GET("/locations", locationProvider)          // just the name and coordinate provider
		maps.GET("/reviews/:id/:page", reviewProvider)    // provide the reviews of the location id, most recent 50, if there are more do the pagination

		// User-protected routes
		user := maps.Group("/")
		user.Use(middleware.UserAuthenticator, middleware.EmailVerified)
		user.POST("/review", addReview)                 // add a review in the rabbit mq queue for processing
		user.POST("/location", requestLocationAddition) // add a location request in the table

		// Next we will add user navigation, and location sharing feature
		// ...

		// Admin-protected routes
		admin := maps.Group("/")
		// Static data on dashboard
		admin.Use(middleware.UserAuthenticator, middleware.AdminAuthenticator)
		admin.GET("/logs", systemLogsProvider)
		admin.GET("/flag", flaggedReviewsProvider)
		admin.GET("/newLocation", locationRequestProvider)
		admin.GET("/indicators", indicatorProvider)
		// Actions
		admin.POST("/flag/:id", flagAction)         // Allow action like allow or declined, in case of negative action add a mail request in the queue for the mail worker to send a mail of rejection to the user
		admin.POST("/location/:id", locationAction) // Allow the action of user like allow or declined
		admin.POST("/notice", addNotice)

	}
}
