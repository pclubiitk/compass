package maps

import "github.com/gin-gonic/gin"

func addReview(c *gin.Context) {
	// add the request model in the respective file

	// add the review in the database with a pending status

	// Future TODO: add a logic to prevent attack on this route

	// add a task for the moderator to process that request
}

func requestLocationAddition(c *gin.Context) {
	// add the request model in the respective file

	// add the location in the table with a pending status

	// Future TODO: add a logic to prevent attack on this route

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation
}
