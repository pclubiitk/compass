package maps

import (
	"compass/model"

	"github.com/google/uuid"
)

func allRequestedImagesAvailable(imageIDs []uuid.UUID, availableImages []model.Image) bool {
	available := make(map[uuid.UUID]struct{}, len(availableImages))
	for _, image := range availableImages {
		if image.ParentAssetID == uuid.Nil && image.ParentAssetType == "" {
			available[image.ImageID] = struct{}{}
		}
	}
	for _, imageID := range imageIDs {
		if _, ok := available[imageID]; !ok {
			return false
		}
	}
	return true
}
