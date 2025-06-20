package auth

import "github.com/gin-gonic/gin"

func loginHandler(c *gin.Context) {
	// define the login request model in the request model as per need

	// Verify the password hash with the provided password

	// on verification create a valid jwt token having the role of the user, (admin, user)
	// using the middleware token function, you are required to write the token generator and verifier code

	// Save the token in cookie

	// Handle all the edge cases with suitable return http code, write them in the read me for later documentation


}
