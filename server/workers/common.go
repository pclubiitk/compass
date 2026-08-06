package workers

import (
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/google/uuid"
)

// This function was copied from assets/utils.go because an import cycle was created as
// assets imported from workers which again imported from assets. Such an import cycle
// is not allowed, (gives error while running docker compose)

// Hence moved the function here into package workers for moderation queue and image storage pipeline.

// Move form tmp to public
// FIXME(prod): Assumption both public and tmp exist
// TODO: ensure on server the folders are not deletable
func MoveImageFromTmpToPublic(imageID uuid.UUID) error {
	tmpPath := filepath.Join("./assets/tmp", fmt.Sprintf("%s.webp", imageID))
	publicPath := filepath.Join("./assets/public", fmt.Sprintf("%s.webp", imageID))

	if _, err := os.Stat(tmpPath); os.IsNotExist(err) {
		return fmt.Errorf("source image not found or already used: %w", err)
	}

	// 1. Try the OS pointer rename first
	err := os.Rename(tmpPath, publicPath)
	if err == nil {
		return nil
	}

	// 2. If it failed likely due to Docker cross-device links, fall back to byte copy
	inputFile, err := os.Open(tmpPath)
	if err != nil {
		return fmt.Errorf("could not open source file: %w", err)
	}
	defer inputFile.Close()

	outputFile, err := os.Create(publicPath)
	if err != nil {
		return fmt.Errorf("could not create dest file: %w", err)
	}
	defer outputFile.Close()

	if _, err = io.Copy(outputFile, inputFile); err != nil {
		return fmt.Errorf("writing to output file failed: %w", err)
	}

	inputFile.Close()
	outputFile.Close()

	if err := os.Remove(tmpPath); err != nil {
		return fmt.Errorf("failed to remove source file: %w", err)
	}

	return nil
}

// DeleteImageFiles removes every on-disk representation of an image. Missing
// files are expected when cleanup is retried, so deletion is idempotent.
func DeleteImageFiles(imageID uuid.UUID) error {
	paths := []string{
		filepath.Join("./assets/tmp", fmt.Sprintf("%s.webp", imageID)),
		filepath.Join("./assets/public", fmt.Sprintf("%s.webp", imageID)),
	}

	for _, path := range paths {
		if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
			return fmt.Errorf("failed to delete image %s: %w", imageID, err)
		}
	}

	return nil
}
