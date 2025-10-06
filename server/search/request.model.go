package search

import "time"

type changeLogRequest struct {
	LastUpdateTime time.Time `json:"lastUpdateTime" binding:"required"`
}

type toggleVisibilityRequest struct {
	// Gin's required validator treats the boolean false as a "zero value," hence ignore it in the request
	Visibility *bool `json:"visibility" binding:"required"`
}
