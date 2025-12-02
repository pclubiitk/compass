package workers

import 
( "fmt"
	
	"os"
	"path/filepath"
	"github.com/google/uuid"
)

//thsi function is copied from assets/utils.go because an import cycle was created as assests imported from workers which again imported from assets
//such an import cycle is not allowed, (gives error while running docker compose)
//Hence removed import assests from package workers by copying the same function for moderation queue and image storage pipeline.

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