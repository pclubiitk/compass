package workers

import (
	"fmt"
	"github.com/google/uuid"
	"os"
	"path/filepath"
)

// This function is copied from assets/utils.go because an import cycle was created as
// assets imported from workers which again imported from assets. Such an import cycle
// is not allowed, (gives error while running docker compose)

// Hence removed import assets from package workers by copying the same function for
// moderation queue and image storage pipeline.

func MoveImageFromTmpToPublic(imageID uuid.UUID) error {
	tmpPath := filepath.Join("./assets/tmp", fmt.Sprintf("%s.webp", imageID))
	publicPath := filepath.Join("./assets/public", fmt.Sprintf("%s.webp", imageID))
	// Ensure file exists
	if _, err := os.Stat(tmpPath); os.IsNotExist(err) {
		return fmt.Errorf("source image not found or already used")
	}
	// Move the file
	if err := os.Rename(tmpPath, publicPath); err != nil {
		return fmt.Errorf("failed to move image")
	}
	return nil
}
