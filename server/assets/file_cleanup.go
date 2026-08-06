package assets

import (
	"fmt"
	"os"
)

func deleteImage(path string) error {
	if err := os.Remove(path); err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}
	return nil
}
