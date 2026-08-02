package connections

import "gorm.io/gorm"

func UserSelect(db *gorm.DB) *gorm.DB {
	return db.Omit("profile").Select("user_id")
}

// RecentContributedLocations loads the latest contributions for a user's
// profile. It includes pending, approved, and rejected records so a submission
// remains visible throughout moderation.
func RecentContributedLocations(db *gorm.DB) *gorm.DB {
	return db.Preload("CoverPic", func(tx *gorm.DB) *gorm.DB {
		return tx.
			Where("parent_asset_id IS NOT NULL").
			Where("parent_asset_type = ?", "locations")
	}).
		// A contribution can become newly relevant when its moderation status
		// changes, not only when it is first submitted. Sort by the last change
		// so recently approved locations are returned alongside new pending ones.
		Order("updated_at DESC").
		Order("location_id DESC").
		Limit(10)
}

func RecentFiveNotices(db *gorm.DB) *gorm.DB {
	return db.Preload("CoverPic", func(tx *gorm.DB) *gorm.DB {
		return tx.
			Where("parent_asset_id IS NOT NULL").
			Where("parent_asset_type = ?", "notices")
	}).
		Order("created_at DESC").
		Limit(5)
}

func RecentFiveReviews(db *gorm.DB) *gorm.DB {
	return db.Preload("Images", func(tx *gorm.DB) *gorm.DB {
		return tx.
			Where("parent_asset_id IS NOT NULL").
			Where("parent_asset_type = ?", "Review")
	}).
		Order("created_at DESC").
		Limit(5)
}

func ImageSelect(db *gorm.DB) *gorm.DB {
	return db.
		Where("parent_asset_id IS NOT NULL").
		Select(
			"image_id",
			"owner_id",
			"status",
			"parent_asset_id",
			"parent_asset_type",
		)
}
