package connections

import "gorm.io/gorm"

func UserSelect(db *gorm.DB) *gorm.DB {
	return db.Select("user_id", "name")
}

func RecentFive(db *gorm.DB) *gorm.DB {
	return db.Order("created_at DESC").Limit(5)
}

func ImageSelect(db *gorm.DB) *gorm.DB {
	return db.Select("image_id", "path", "status", "owner_id")
}
