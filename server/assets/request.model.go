package assets

import "mime/multipart"

type ImageUploadRequest struct {
	File *multipart.FileHeader `form:"file" binding:"required"`
}
