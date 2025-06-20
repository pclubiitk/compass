package maps

import "github.com/gin-gonic/gin"

func systemLogsProvider(c *gin.Context) {
	// static data, provide the logs, try to modify the route such that you enable pagination

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation
}

func flaggedReviewsProvider(c *gin.Context) {
	// filter the bot rejected reviews

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation
}

func locationRequestProvider(c *gin.Context) {
	// filter the pending location requests

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation
}

func indicatorProvider(c *gin.Context) {
	// add helper functions, and provide the indicators to the user
}