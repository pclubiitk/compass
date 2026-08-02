// Package profileaccess defines the server-side eligibility policy for the
// student directory.
package profileaccess

import (
	"strings"

	"compass/model"
)

// IsComplete reports whether every mandatory Step 3 identity field is present.
func IsComplete(profile model.Profile) bool {
	mandatory := [...]string{
		profile.Name,
		profile.RollNo,
		profile.Dept,
		profile.Course,
		profile.Gender,
	}

	for _, value := range mandatory {
		if strings.TrimSpace(value) == "" {
			return false
		}
	}

	switch strings.ToUpper(strings.TrimSpace(profile.Gender)) {
	case "M", "F", "O":
		return true
	default:
		return false
	}
}

// CanSearch enforces the directory's reciprocity rule: a user may search only
// after completing Step 3 and while their own profile is visible.
func CanSearch(profile model.Profile) bool {
	return profile.Visibility && IsComplete(profile)
}

// VisibilityAfterCompletion enables a newly completed profile without
// overriding the privacy choice of a user whose profile was already complete.
func VisibilityAfterCompletion(current model.Profile) bool {
	if IsComplete(current) {
		return current.Visibility
	}
	return true
}
