package maps

import (
	"compass/connections"
	"compass/model"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

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
	var input AddNotice

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	
	userID, err := c.Cookie("user_id")
    if err != nil {
        c.JSON(401, gin.H{"error": "Unauthorized - no session cookie"})
        return
    }



	notice := model.Notice{
		NoticeId:    uuid.NewString(), // generates a UUID string like "f47ac10b-58cc-4372-a567-0e02b2c3d479"
		Title:       input.Title,
		Description: input.Description,
		Preview:     input.Preview,
		ContributedBy: userID, // user.UserID value
	}

	if err := connections.DB.Create(&notice).Error; err != nil {
		logrus.Fatal("Failed to create notice:", err)
	}

	c.JSON(201,gin.H{"message":"New notice added successfully","notice":notice})
}
