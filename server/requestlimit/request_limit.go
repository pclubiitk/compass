package requestlimit

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// MaxRequestBodyBytes leaves room for multipart framing around a 10 MiB file.
const MaxRequestBodyBytes int64 = 11 << 20

// Middleware applies a hard cap even when a request uses chunked encoding or
// omits Content-Length.
func Middleware(maxBytes int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.ContentLength > maxBytes {
			c.AbortWithStatusJSON(http.StatusRequestEntityTooLarge, gin.H{"error": "Request body is too large"})
			return
		}

		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBytes)
		c.Next()
	}
}
