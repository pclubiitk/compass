package workers

import (
	"compass/connections"
	"compass/model"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

func getReviewAndUser(reviewID uuid.UUID) (model.Review, model.User, error) {
	var review model.Review
	if err := connections.DB.Where("review_id = ?", reviewID).First(&review).Error; err != nil {
		return review, model.User{}, err
	}

	var user model.User
	if err := connections.DB.Where("user_id = ?", review.ContributedBy).First(&user).Error; err != nil {
		return review, user, err
	}

	return review, user, nil
}

func handleReviewModeration(reviewID uuid.UUID, flagged bool) error {
	review, user, err := getReviewAndUser(reviewID)
	if err != nil {
		return err
	}

	if flagged {
		return rejectReviewByBot(review, user)
	}

	return approveReviewAndNotify(&review, user)
}

func rejectReviewByBot(review model.Review, user model.User) error {
	if err := connections.DB.Model(&model.Review{}).
		Where("review_id = ?", review.ReviewId).
		Update("status", model.RejectedByBot).Error; err != nil {
		return err
	}

	mailJob := MailJob{
		Type: "violation_warning",
		To:   user.Email,
		Data: map[string]interface{}{
			"username": user.Email,
			"reason":   "Your review text violated our content policy and was flagged for admin review.",
		},
	}
	if err := sendEmail(mailJob); err != nil {
		logrus.Errorf("Failed to queue violation email for %s: %v", user.Email, err)
	}

	return nil
}

func ApproveReviewRecord(reviewID uuid.UUID) (bool, error) {
	var successfullyApproved bool

	err := connections.DB.Transaction(func(tx *gorm.DB) error {
		var review model.Review
		if err := tx.Where("review_id = ?", reviewID).First(&review).Error; err != nil {
			return err
		}

		// Only pending or bot-flagged reviews can be approved.
		// Already approved or admin-rejected reviews are not re-processed.
		if review.Status != model.Pending && review.Status != model.RejectedByBot {
			successfullyApproved = false
			return nil // not an error, just a no-op
		}

		if err := tx.Model(&model.Review{}).
			Where("review_id = ?", reviewID).
			Update("status", model.Approved).Error; err != nil {
			return err
		}

		var location model.Location
		if err := tx.Where("location_id = ?", review.LocationId).First(&location).Error; err != nil {
			return err
		}

		location.ReviewCount += 1
		location.AverageRating = ((location.AverageRating * float32(location.ReviewCount-1)) + float32(review.Rating)) / float32(location.ReviewCount)

		successfullyApproved = true
		return tx.Save(&location).Error
	})

	return successfullyApproved, err
}

func approveReviewAndNotify(review *model.Review, user model.User) error {
	wasApproved, err := ApproveReviewRecord(review.ReviewId)
	if err != nil {
		return err
	}

	if !wasApproved {
		// The transaction noticed the review was already rejected (likely by the image worker)
		// We log it, skip the thank you email, and return nil so RabbitMQ marks the job as done.
		logrus.Infof("Review %s was not in pending state (likely flagged by image worker). Skipping approval email.", review.ReviewId)
		return nil
	}

	mailJob := MailJob{
		Type: "thanks_contribution",
		To:   user.Email,
		Data: map[string]interface{}{
			"username":      user.Email,
			"content_title": "Your review",
		},
	}

	if err := sendEmail(mailJob); err != nil {
		logrus.Errorf("Failed to queue thank-you email for %s: %v", user.Email, err)
	}

	return nil
}
