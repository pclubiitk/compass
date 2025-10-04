package connections

import "gorm.io/gorm"

func UserSelect(db *gorm.DB) *gorm.DB {
	return db.Omit("profile").Select("user_id")
}
// Specially for reviews
// TODO: Correct the logic, after completing the upload and moderation logic once
// TODO: Issue of null pointer accesss while pre loading, need to find better way
func RecentFiveLocations(db *gorm.DB) *gorm.DB {
	return db.Preload("CoverPic", func(tx *gorm.DB) *gorm.DB {
		return tx.
			Where("parent_asset_id IS NOT NULL").
			Where("parent_asset_type = ?", "locations")
	}).
		Order("created_at DESC").
		Limit(5)
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
			Where("parent_asset_type = ?", "reviews")
	}).
		Order("created_at DESC").
		Limit(5)
}

func ImageSelect(db *gorm.DB) *gorm.DB {
	return db.
		Where("parent_asset_id IS NOT NULL").
		Select("image_id", "status", "owner_id")
}
