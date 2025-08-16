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
// TODO: Correct the logic, after completing the upload and moderation logic once
func RecentFiveReviews(db *gorm.DB) *gorm.DB {
	return db.Preload("Images", func(tx *gorm.DB) *gorm.DB {
		return tx.
			Where("parent_asset_id IS NOT NULL").
			Where("parent_asset_type = ?", "reviews")
	}).
		Order("created_at DESC").
		Limit(5)
}

func ImageSelect(db *gorm.DB) *gorm.DB {
	return db.Select("image_id", "status", "owner_id")
}
