// Package directorycache creates opaque identifiers used to synchronize the
// public student-directory cache without exposing account UUIDs in tombstones.
package directorycache

import (
	"crypto/sha256"
	"encoding/hex"

	"github.com/google/uuid"
)

const cacheIDDomain = "student-directory-cache:v1:"

// ID returns a stable, one-way identifier for a directory cache entry.
func ID(userID uuid.UUID) string {
	digest := sha256.Sum256([]byte(cacheIDDomain + userID.String()))
	return hex.EncodeToString(digest[:])
}

// IDs converts user IDs to cache identifiers while preserving their order.
func IDs(userIDs []uuid.UUID) []string {
	cacheIDs := make([]string, len(userIDs))
	for i, userID := range userIDs {
		cacheIDs[i] = ID(userID)
	}
	return cacheIDs
}
