package connections

import "gorm.io/gorm"

func UserSelect(db *gorm.DB) *gorm.DB {
	return db.Select("user_id", "name")
}

func RecentFive(db *gorm.DB) *gorm.DB {
	// Get the images url into it
	return db.Preload("CoverPic", ImageSelect).
		Order("created_at DESC").Limit(5)
}

// Specially for reviews
func RecentFiveReviews(db *gorm.DB) *gorm.DB {
	return db.Preload("Images", ImageSelect).
		Order("created_at DESC").Limit(5)
}

func ImageSelect(db *gorm.DB) *gorm.DB {
	return db.Select("image_id", "status", "owner_id")
}
