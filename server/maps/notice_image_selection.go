package maps

import (
	"compass/model"

	"github.com/google/uuid"
)

func appendUniqueImageID(ids []uuid.UUID, seen map[uuid.UUID]struct{}, id uuid.UUID) []uuid.UUID {
	if id == uuid.Nil {
		return ids
	}
	if _, exists := seen[id]; exists {
		return ids
	}
	seen[id] = struct{}{}
	return append(ids, id)
}

func requestedNoticeImageIDs(input AddNoticeRequest) []uuid.UUID {
	seen := make(map[uuid.UUID]struct{})
	ids := make([]uuid.UUID, 0)
	if input.CoverPic != nil {
		ids = appendUniqueImageID(ids, seen, *input.CoverPic)
	}
	if input.BioPics != nil {
		for _, id := range *input.BioPics {
			ids = appendUniqueImageID(ids, seen, id)
		}
	}
	return ids
}

func desiredNoticeImageIDs(input AddNoticeRequest, existing []model.Image, existingCoverID uuid.UUID) []uuid.UUID {
	seen := make(map[uuid.UUID]struct{})
	ids := make([]uuid.UUID, 0, len(existing)+1)

	if input.coverPicSupplied() {
		if input.CoverPic != nil {
			ids = appendUniqueImageID(ids, seen, *input.CoverPic)
		}
	} else {
		ids = appendUniqueImageID(ids, seen, existingCoverID)
	}

	if input.bioPicsSupplied() {
		if input.BioPics != nil {
			for _, id := range *input.BioPics {
				ids = appendUniqueImageID(ids, seen, id)
			}
		}
	} else {
		for _, image := range existing {
			if image.ImageID != existingCoverID {
				ids = appendUniqueImageID(ids, seen, image.ImageID)
			}
		}
	}

	return ids
}
