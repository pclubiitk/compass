package assets

import (
	"errors"
	"fmt"

	"github.com/h2non/bimg"
)

const (
	MaxImageUploadBytes int64 = 10 << 20 // 10 MiB
	maxImageDimension         = 4096
	maxImagePixels            = 16_000_000
)

var (
	ErrImageTooLarge           = errors.New("image file is too large")
	ErrImageDimensionsExceeded = errors.New("image dimensions exceed the allowed limit")
)

func ValidateImageSize(size int64) error {
	if size < 0 || size > MaxImageUploadBytes {
		return ErrImageTooLarge
	}
	return nil
}

// validateImageMetadata runs before decoding pixels. Dimension limits prevent a
// small compressed input from forcing an unbounded image allocation.
func validateImageMetadata(metadata bimg.ImageMetadata) error {
	width, height := metadata.Size.Width, metadata.Size.Height
	if width <= 0 || height <= 0 {
		return fmt.Errorf("invalid image dimensions %dx%d", width, height)
	}
	if width > maxImageDimension || height > maxImageDimension || width > maxImagePixels/height {
		return ErrImageDimensionsExceeded
	}
	return nil
}
