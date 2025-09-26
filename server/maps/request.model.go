package maps

import (
	"compass/model"
	"time"

	"github.com/google/uuid"
)

type AddLocationRequest struct {
	// TODO: Need to handle the case where i again request for the same location
	Name         string       `json:"name"`
	Latitude     float32      `json:"latitude" binding:"required"`
	Longitude    float32      `json:"longitude" binding:"required"`
	LocationType string       `json:"locationType"`
	Description  string       `json:"description" binding:"max=250"`
	CoverPic     *uuid.UUID   `json:"coverpic"`
	BioPics      *[]uuid.UUID `json:"biopics"`
}

// TODO: Better way, instead of this function
// Convert the request model to the location model
func (r AddLocationRequest) ToLocation(userID uuid.UUID) model.Location {
	return model.Location{
		Name:          r.Name,
		Latitude:      r.Latitude,
		Longitude:     r.Longitude,
		LocationType:  r.LocationType,
		Description:   r.Description,
		ContributedBy: userID,
		Status:        model.Pending, // By default it is waiting to be reviewed by admin
	}
}

type AddNoticeRequest struct {
	Title       string     `json:"title" binding:"required"`
	Description string     `json:"description" binding:"required"`
	Body        string     `json:"body"`
	CoverPic    *uuid.UUID `json:"coverPic"`
	Entity      string     `json:"entity"`
	EventTime   time.Time  `json:"eventTime"`
	Location    string     `json:"location"`
}

type AddReviewRequest struct {
	Description string       `gorm:"type:text" json:"description"`
	Rating      int8         `json:"rating"`
	LocationId  uuid.UUID    `json:"locationId"`
	Images      *[]uuid.UUID `json:"images"`
}

// TODO: better way, i don't want this separate function
func (r AddReviewRequest) ToReview(userID uuid.UUID) model.Review {
	return model.Review{
		Description:   r.Description,
		Rating:        r.Rating,
		ContributedBy: userID,
		LocationId:    r.LocationId,
		Status:        model.Pending,
	}
}

type FlagActionRequest struct {
	Action  string `json:"action" binding:"required,oneof=approved rejected"`
	Message string `json:"message"`
}
