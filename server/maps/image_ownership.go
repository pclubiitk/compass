package maps

import (
	"compass/model"

	"github.com/google/uuid"
)

func allRequestedImagesOwned(imageIDs []uuid.UUID, ownedImages []model.Image) bool {
	owned := make(map[uuid.UUID]struct{}, len(ownedImages))
	for _, image := range ownedImages {
		owned[image.ImageID] = struct{}{}
	}
	for _, imageID := range imageIDs {
		if _, ok := owned[imageID]; !ok {
			return false
		}
	}
	return true
}
