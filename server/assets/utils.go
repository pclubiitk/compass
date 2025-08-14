package assets

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"

	"github.com/google/uuid"
	"github.com/h2non/bimg"
	"github.com/spf13/viper"
)

// Compressor and convert
// TODO: Need to fix the quality for different image type, as png is very heavy
// TODO: Fix the upload issue of heic / heif
func cncImage(image *multipart.FileHeader) ([]byte, error) {
	file, err := image.Open()
	if err != nil {
		return nil, err
	}
	defer file.Close()
	imgBytes, err := io.ReadAll(file)
	if err != nil {
		return nil, err
	}
	options := bimg.Options{
		// TODO: Make the width and the height according to the formate
		Quality: viper.GetInt("image.qualtiy"),
		// Width:   payload.Width,
		// Height:  payload.Height,
	}
	// Image format converter
	newImage := bimg.NewImage(imgBytes)
	fmt.Print(newImage.Type())
	if newImage.Type() == "heif" {
		return nil, fmt.Errorf("we currently do not support heic format")
	} else if processedImage, err := newImage.Process(options); err != nil {
		return nil, err
	} else {
		return processedImage, nil
	}
}

// Save image
func saveImage(image []byte, path string, id uuid.UUID) (string, error) {
	savePath := fmt.Sprintf("./"+path+"/%s.webp", id)
	writeError := bimg.Write(savePath, image)
	return savePath, writeError
}

// Move form tmp to public
func moveImage(id uuid.UUID) {

}

// Delete image
func deleteImage(path string) error {
	// File exists ?
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return fmt.Errorf("file does not exist: %s", path)
	}
	// Delete the file
	if err := os.Remove(path); err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}
	return nil
}
