package workers

import (
	"fmt"
	"github.com/google/uuid"
	"io"
	"os"
	"path/filepath"
)

// This function is copied from assets/utils.go because an import cycle was created as
// assets imported from workers which again imported from assets. Such an import cycle
// is not allowed, (gives error while running docker compose)

// Hence removed import assets from package workers by copying the same function for
// moderation queue and image storage pipeline.

// func MoveImageFromTmpToPublic(imageID uuid.UUID) error {
// 	tmpPath := filepath.Join("./assets/tmp", fmt.Sprintf("%s.webp", imageID))
// 	publicPath := filepath.Join("./assets/public", fmt.Sprintf("%s.webp", imageID))
// 	// Ensure file exists
// 	if _, err := os.Stat(tmpPath); os.IsNotExist(err) {
// 		return fmt.Errorf("source image not found or already used")
// 	}
// 	// Move the file
// 	if err := os.Rename(tmpPath, publicPath); err != nil {
// 		return fmt.Errorf("failed to move image")
// 	}
// 	return nil
// }

func MoveImageFromTmpToPublic(imageID uuid.UUID) error {
    tmpPath := filepath.Join("./assets/tmp", fmt.Sprintf("%s.webp", imageID))
    publicPath := filepath.Join("./assets/public", fmt.Sprintf("%s.webp", imageID))

    // 1. Force Docker to create the public directory if it doesn't exist
    if err := os.MkdirAll("./assets/public", os.ModePerm); err != nil {
        return fmt.Errorf("could not create public folder: %w", err)
    }

    // 2. Ensure source file actually exists
    if _, err := os.Stat(tmpPath); os.IsNotExist(err) {
        return fmt.Errorf("source image not found or already used: %w", err)
    }

    // 3. Open the source file
    inputFile, err := os.Open(tmpPath)
    if err != nil {
        return fmt.Errorf("could not open source file: %w", err)
    }
    defer inputFile.Close()

    // 4. Create the destination file
    outputFile, err := os.Create(publicPath)
    if err != nil {
        return fmt.Errorf("could not create dest file: %w", err)
    }
    defer outputFile.Close()

    // 5. Copy the bytes (bypasses Docker's cross-device restrictions)
    if _, err = io.Copy(outputFile, inputFile); err != nil {
        return fmt.Errorf("writing to output file failed: %w", err)
    }

    // 6. Explicitly close files BEFORE deleting. 
    // This is critical because a Windows host will throw severe file-locking 
    // errors if you try to delete a file that is still technically "open".
    inputFile.Close()
    outputFile.Close()

    // 7. Delete the original temp file
    if err := os.Remove(tmpPath); err != nil {
        return fmt.Errorf("failed to remove source file: %w", err)
    }
    
    return nil
}
