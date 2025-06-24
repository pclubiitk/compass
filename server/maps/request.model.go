package maps

import (
)

// Complete the following request models

type AddReview struct{
}

type Status string
const (
	Pending       Status = "pending"
	Approved      Status = "approved"
	Rejected      Status = "rejected"      // if rejected by admin finally
	RejectedByBot Status = "rejectedByBot" // if rejected by bot
)

type RequestAddLocation struct {
	Id int `json:"id"` // have to make unique or auto-increment
	Title string `json:"title"`
	Latitude float32 `json:"latitude"`
	Longitude float32 `json:"longitude"`
	Location_type string `json:"location_type"`
	Contributor_id string `json:"contributor_id"` //contributedBy
	Description string `json:"description"` // have to add ch limit
	Image string `json:"image"` // image url
	Status  Status `json:"action"`  // "approved" or "rejected"
	Message string `json:"message"`
}

type AddNotice struct {

}