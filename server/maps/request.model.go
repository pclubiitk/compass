package maps

import (
	"compass/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AddLocationRequest struct {
	// TODO: Need to handle the case where i again request for the same location
	Name          string      `json:"name"`
	Latitude      float32     `json:"latitude" binding:"required"`
	Longitude     float32     `json:"longitude" binding:"required"`
	LocationType  string      `json:"locationType"`
	ContributedBy uuid.UUID   `json:"contributedBy" binding:"required"`
	Description   string      `json:"description" binding:"max=250"`
	CoverPic      *uuid.UUID  `json:"coverpic"`
	BioPics       *[]uuid.UUID `json:"biopics"`
}

// convert the request model to the location model
func (r AddLocationRequest) ToLocation() model.Location {
	loc := model.Location{
		Name:          r.Name,
		Latitude:      r.Latitude,
		Longitude:     r.Longitude,
		LocationType:  r.LocationType,
		Description:   r.Description,
		ContributedBy: r.ContributedBy,
		Status:        "pending", // By default it is waiting to be reviewed by admin
	}
	return loc
}

type AddNoticeRequest struct {
	Title           string     `json:"title" binding:"required"`
	Preview         string     `json:"preview"`
	CardDescription string     `json:"cardDescription"`
	Description     string     `json:"description"`
	ContributedBy   *uuid.UUID `json:"contributedBy"`
}

type AddReviewRequest struct {
	gorm.Model
	Description string      `gorm:"type:text" json:"description"`
	Rating      float32     `json:"rating"`
	Status      string      `gorm:"type:varchar(20);check:status IN ('pending','approved','rejected', 'rejectedByBot')"`
	LocationId  string      `json:"locationId"`
	User        *uuid.UUID  `json:"UserID"`
	Images      []uuid.UUID `json:"images"`
}
type FlagActionRequest struct {
	Action  string `json:"action" binding:"required,oneof=approved rejected"`
	Message string `json:"message"`
}
