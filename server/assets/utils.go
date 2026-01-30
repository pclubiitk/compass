package assets

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"

	"github.com/google/uuid"
	"github.com/h2non/bimg"
	"github.com/kolesa-team/go-webp/encoder"
	"github.com/kolesa-team/go-webp/webp"
	"github.com/spf13/viper"
	heif "github.com/strukturag/libheif/go/heif"
)

// CncImage compresses and converts image to WebP format
// TODO: Need to fix the quality for different image type, as png is very heavy
func CncImage(image *multipart.FileHeader) ([]byte, error) {
	file, err := image.Open()
	if err != nil {
		return nil, err
	}
	defer file.Close()
	imgBytes, err := io.ReadAll(file)
	if err != nil {
		return nil, err
	}
	return ProcessImageBytes(imgBytes)
}

// ProcessImageBytes processes raw image bytes converting them to WebP
func ProcessImageBytes(imgBytes []byte) ([]byte, error) {
	options := bimg.Options{
		// TODO: Make the width and the height according to the formate
		Quality: viper.GetInt("image.quality"),
		// Width:   payload.Width,
		// Height:  payload.Height,
	}
	// Image format converter

	newImage := bimg.NewImage(imgBytes)
	imgType := newImage.Type()

	if imgType == "heic" || imgType == "heif" || imgType == "HEIC" || imgType == "HEIF" {
		ctx, err := heif.NewContext()
		if err != nil {
			return nil, fmt.Errorf("failed to create HEIF context: %w", err)
		}

		if err := ctx.ReadFromMemory(imgBytes); err != nil {
			return nil, fmt.Errorf("failed to read HEIC data: %w", err)
		}

		handle, err := ctx.GetPrimaryImageHandle()
		if err != nil {
			return nil, fmt.Errorf("failed to get primary image handle: %w", err)
		}

		// This was showing an error due to depreciated syntax..now cleared as NewDecodingOptions function returns two values , not one.

		decodingOpts, err := heif.NewDecodingOptions()
		if err != nil {
			return nil, fmt.Errorf("failed to create HEIF decoding options: %w", err)
		}
		heifImg, err := handle.DecodeImage(heif.ColorspaceRGB, heif.ChromaInterleavedRGBA, decodingOpts)
		if err != nil {
			return nil, fmt.Errorf("failed to decode HEIC image: %w", err)
		}

		// Convert *heif.Image → Go image.Image
		rgbaImg, err := heifImg.GetImage()
		if err != nil {
			return nil, fmt.Errorf("failed to get Go image: %w", err)
		}

		// Encoding directly to WebP in memory using golang webp encoder
		var webpBuffer bytes.Buffer
		webpOptions, err := encoder.NewLossyEncoderOptions(encoder.PresetDefault, 80)
		if err != nil {
			return nil, fmt.Errorf("failed to create WebP encoder options: %w", err)
		}

		if err := webp.Encode(&webpBuffer, rgbaImg, webpOptions); err != nil {
			return nil, fmt.Errorf("failed to encode WebP: %w", err)
		}

		return webpBuffer.Bytes(), nil
	}
	processedImage, err := newImage.Process(options)
	if err != nil {
		return nil, err
	}

	return processedImage, nil
}

// Save image
func SaveImage(image []byte, path string, id uuid.UUID) (string, error) {
	fileName := fmt.Sprintf("%s.webp", id)
	savePath := filepath.Join(path, fileName)
	if err := os.MkdirAll(path, os.ModePerm); err != nil {
		return savePath, err
	}
	writeError := bimg.Write(savePath, image)
	return savePath, writeError
}

// Move form tmp to public
// Assumption both public and tmp exist
// TODO: ensure on server the folders are not deletable
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
