package maps

import (
	"compass/connections"
	"compass/model"
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"github.com/google/uuid"

	// "log"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"gorm.io/gorm"
)

func noticeProvider(c *gin.Context) {

	// Parse pagination flag
	paginationStr := c.DefaultQuery("pagination", "true")
	pagination, err := strconv.ParseBool(paginationStr)
	if err != nil {
		pagination = true
	}

	// Base query
	query := connections.DB.
		Model(&model.Notice{}).
		Preload("User", connections.UserSelect).
		Order("created_at DESC")

	var noticeList []model.Notice

	// Pagination logic
	if pagination {
		page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
		if err != nil || page < 1 {
			page = 1
		}

		limit := viper.GetInt("noticeboard.limit")
		offset := (page - 1) * limit

		if err := query.
			Limit(limit).
			Offset(offset).
			Find(&noticeList).
			Error; err != nil {

			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch notices",
			})
			return
		}

		// Count total notices
		var count int64
		if err := connections.DB.Model(&model.Notice{}).Count(&count).Error; err != nil {
			logrus.Errorf("Failed to count notices: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to count notices",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"noticeboard_list": publicNotices(noticeList),
			"total_notices":    count,
			"current_page":     page,
		})
		return
	}

	// No pagination
	if err := query.Find(&noticeList).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch notices",
		})
		return
	}

	fmt.Printf("Fetched all notices without pagination: %d\n", len(noticeList))

	c.JSON(http.StatusOK, gin.H{
		"noticeboard_list": publicNotices(noticeList),
	})
}

// noticeDetailProvider fetches a single notice by its ID using GORM.
func noticeDetailProvider(c *gin.Context) {

	// Get and validate the ID from the URL
	noticeIDStr := c.Param("id")
	noticeID, err := uuid.Parse(noticeIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notice ID format"})
		return
	}

	// Query the database for the notice, preloading the User
	var notice model.Notice
	result := connections.DB.
		Model(&model.Notice{}).
		Preload("User", connections.UserSelect). // Preload user data, just like in noticeProvider
		Where("notice_id = ?", noticeID).
		First(&notice) // Use First() to get a single record

	// Handle any errors from the database query
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Notice not found"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notice"})
		return
	}

	c.JSON(http.StatusOK, publicNotice(notice))
}

// noticeResponse is the public contract for notice endpoints. It deliberately
// excludes ownership and ORM audit fields from the persistence model.
type noticeResponse struct {
	ID           uuid.UUID `json:"id"`
	Entity       string    `json:"entity"`
	EventTime    time.Time `json:"eventTime"`
	EventEndTime time.Time `json:"eventEndTime"`
	Location     string    `json:"location"`
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	Body         string    `json:"body,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

func publicNotice(notice model.Notice) noticeResponse {
	return noticeResponse{
		ID:           notice.NoticeId,
		Entity:       notice.Entity,
		EventTime:    notice.EventTime,
		EventEndTime: notice.EventEndTime,
		Location:     notice.Location,
		Title:        notice.Title,
		Description:  notice.Description,
		Body:         notice.Body,
		CreatedAt:    notice.CreatedAt,
	}
}

func publicNotices(notices []model.Notice) []noticeResponse {
	response := make([]noticeResponse, len(notices))
	for i, notice := range notices {
		response[i] = publicNotice(notice)
	}
	return response
}

func incrementalLocationProvider(c *gin.Context) {
	sinceStr := c.Query("since")

	type deletedLocationResp struct {
		LocationId uuid.UUID `json:"locationId"`
		DeletedAt  time.Time `json:"deletedAt"`
	}
	// If since time is empty, provide all locations
	if sinceStr == "" {
		var locs []model.Location
		if err := connections.DB.
			Model(&model.Location{}).
			Where("status = ?", model.Approved).
			Select("location_id", "name", "latitude", "longitude", "updated_at", "location_type", "layer").
			Find(&locs).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch locations"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"locations":     locs,
			"deleted":       []deletedLocationResp{},
			"lastFetchTime": time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	since, err := time.Parse(time.RFC3339, sinceStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid since timestamp"})
		return
	}

	var (
		updated []model.Location
		deleted []deletedLocationResp
	)

	if err := connections.DB.
		Model(&model.Location{}).
		Where("status = ? AND updated_at > ?", model.Approved, since).
		Select("location_id", "name", "latitude", "longitude", "updated_at", "location_type").
		Find(&updated).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated locations"})
		return
	}

	if err := connections.DB.Unscoped().
		Model(&model.Location{}).
		Where("deleted_at > ?", since).
		Select("location_id", "deleted_at").
		Scan(&deleted).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch deleted locations"})
		return
	}

	maxTime := since
	for _, loc := range updated {
		if loc.UpdatedAt.After(maxTime) {
			maxTime = loc.UpdatedAt
		}
	}
	for _, del := range deleted {
		if del.DeletedAt.After(maxTime) {
			maxTime = del.DeletedAt
		}
	}
	if maxTime.Equal(since) {
		maxTime = time.Now().UTC()
	}

	c.JSON(http.StatusOK, gin.H{
		"locations":     updated,
		"deleted":       deleted,
		"lastFetchTime": maxTime.Format(time.RFC3339),
	})
}

func locationDetailProvider(c *gin.Context) {
	id := c.Param("id")
	var loc model.Location

	if err := connections.DB.
		Model(&model.Location{}).
		Select("location_id", "name", "description", "latitude", "longitude", "location_type", "layer", "average_rating", "review_count", "tag", "contact", "time").
		Where("location_id = ? AND status = ?", id, model.Approved).
		First(&loc).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Error Fetching location"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"location": publicLocationDetail(loc)})
}

// locationDetailResponse is the public contract for GET /location/:id. Keep
// internal moderation, ownership, and audit fields on model.Location out of
// this unauthenticated endpoint.
type locationDetailResponse struct {
	LocationID    uuid.UUID `json:"locationId"`
	Name          string    `json:"name"`
	Description   string    `json:"description"`
	Latitude      float32   `json:"latitude"`
	Longitude     float32   `json:"longitude"`
	LocationType  string    `json:"locationType"`
	Layer         int       `json:"layer"`
	AverageRating float32   `json:"avgRating"`
	ReviewCount   int64     `json:"reviewCount"`
	Tag           string    `json:"tag"`
	Contact       string    `json:"contact"`
	Time          string    `json:"time"`
}

func publicLocationDetail(loc model.Location) locationDetailResponse {
	return locationDetailResponse{
		LocationID:    loc.LocationId,
		Name:          loc.Name,
		Description:   loc.Description,
		Latitude:      loc.Latitude,
		Longitude:     loc.Longitude,
		LocationType:  loc.LocationType,
		Layer:         loc.Layer,
		AverageRating: loc.AverageRating,
		ReviewCount:   loc.ReviewCount,
		Tag:           loc.Tag,
		Contact:       loc.Contact,
		Time:          loc.Time,
	}
}

func reviewProvider(c *gin.Context) {
	locationID := c.Param("id")

	if locationID == "" {
		c.JSON(400, gin.H{"error": "location_id is required"})
		return
	}

	page := 1
	limit := 50
	if p := c.Param("page"); p != "" {
		if parsedPage, err := strconv.Atoi(p); err != nil || parsedPage < 1 {
			c.JSON(400, gin.H{"error": "invalid page parameter"})
			return
		} else {
			page = parsedPage
		}
	}

	offset := (page - 1) * limit

	reviews, total, err := fetchReviewsByLocationID(locationID, limit, offset)
	if err != nil {
		c.JSON(500, gin.H{"error": "failed to fetch reviews"})
		return
	}

	// hasMore := offset+len(reviews) < total

	c.JSON(200, gin.H{
		"reviews": publicReviews(reviews),
		"page":    page,
		"total":   total,
	})
}

func fetchReviewsByLocationID(locationID string, limit, offset int) ([]model.Review, int, error) {
	var reviews []model.Review
	var total int64
	db := connections.DB

	if err := db.Model(&model.Review{}).Where("location_id = ? AND status = ?", locationID, model.Approved).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := db.
		Preload("User", func(tx *gorm.DB) *gorm.DB {
			return tx.Select("user_id")
		}).
		Preload("User.Profile", func(tx *gorm.DB) *gorm.DB {
			return tx.Select("user_id", "name")
		}).
		Preload("Images", func(tx *gorm.DB) *gorm.DB {
			return tx.Select("image_id", "parent_asset_id")
		}).
		Where("location_id = ? AND status = ?", locationID, model.Approved).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&reviews).Error; err != nil {
		return nil, 0, err
	}

	return reviews, int(total), nil
}

type publicReviewImage struct {
	ImageID uuid.UUID `json:"imageId"`
}

type publicReviewer struct {
	Profile struct {
		Name string `json:"name"`
	} `json:"profile"`
}

type publicReviewResponse struct {
	ReviewID    uuid.UUID           `json:"reviewId"`
	Description string              `json:"description"`
	Rating      int8                `json:"rating"`
	CreatedAt   time.Time           `json:"createdAt"`
	User        publicReviewer      `json:"user"`
	Images      []publicReviewImage `json:"images"`
}

func publicReviews(reviews []model.Review) []publicReviewResponse {
	response := make([]publicReviewResponse, len(reviews))
	for i, review := range reviews {
		entry := publicReviewResponse{
			ReviewID:    review.ReviewId,
			Description: review.Description,
			Rating:      review.Rating,
			CreatedAt:   review.CreatedAt,
			Images:      make([]publicReviewImage, len(review.Images)),
		}
		if review.User != nil {
			entry.User.Profile.Name = review.User.Profile.Name
		}
		for j, image := range review.Images {
			entry.Images[j] = publicReviewImage{ImageID: image.ImageID}
		}
		response[i] = entry
	}
	return response
}

func fetchReviewsByUserID(userID uuid.UUID, limit, offset int) ([]model.Review, int, error) {
	var reviews []model.Review
	var total int64
	db := connections.DB
	// fmt.Printf("userid gotten %T", userID)

	if err := db.Model(&model.Review{}).Where("contributed_by = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := db.
		Preload("Images", func(tx *gorm.DB) *gorm.DB {
			return tx.Where("parent_asset_id IS NOT NULL").Where("parent_asset_type = ?", "reviews")
		}).
		Where("contributed_by = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&reviews).Error; err != nil {
		return nil, 0, err
	}

	return reviews, int(total), nil
}

func getMyReviews(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	reviews, total, err := fetchReviewsByUserID(userID.(uuid.UUID), limit, offset)
	// fmt.Printf("total %d", total)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reviews"})
		return
	}

	response := mapReviews(reviews)

	c.JSON(http.StatusOK, gin.H{
		"reviews": response,
		"total":   total,
	})
}

func mapReviews(reviews []model.Review) []model.Review {
	return reviews
}
