package maps

import "github.com/gin-gonic/gin"

func flagAction(c *gin.Context) {
	// add the request model to the request.model.go file

	// allow the admin to take the actions like approve, reject

	// if the review is rejected, then add the mail in the mail queue to notify the user add a warning to the user model and add one to that

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation

}

func locationAction(c *gin.Context) {
	// add the request model to the request.model.go file

	// add the location in the database if user approve it, else reject it

	// in both the cases notify the user with a mail, either thanking for contribution or saying sorry

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation
}

func addNotice(c *gin.Context) {
	// add the request model to the request.model.go file

	// add the notice in the database

	// publish a mail confirming notice published

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation
}
