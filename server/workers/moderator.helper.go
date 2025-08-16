package workers

import (
	"bytes"
	"compass/connections"
	"compass/model"
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"os"

	"github.com/google/uuid"
	openai "github.com/openai/openai-go/v2"
	"github.com/openai/openai-go/v2/packages/param"
	"github.com/sirupsen/logrus"
)

func loadImageAsBase64(imageID uuid.UUID) (string, error) {
	file, err := os.Open("./assets/tmp/" + fmt.Sprintf("%s.webp", imageID))
	if err != nil {
		return "", fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()
	buf := new(bytes.Buffer)
	if _, err := io.Copy(buf, file); err != nil {
		return "", fmt.Errorf("failed to read image: %w", err)
	}
	return base64.StdEncoding.EncodeToString(buf.Bytes()), nil
}

// ModerateImage Call OpenAI Moderation API
func ModerateImage(imageID uuid.UUID) (bool, error) {
	// Read Image
	base64Image, err := loadImageAsBase64(imageID)
	if err != nil {
		return false, err
	}
	// Structure the image
	// https://pkg.go.dev/github.com/openai/openai-go/v2@v2.0.2#ModerationNewParams
	// Start form the above link and go recursively till the end, to understand the following lines
	params := openai.ModerationNewParams{
		Model: openai.ModerationModel("omni-moderation-latest"),
		Input: openai.ModerationNewParamsInputUnion{
			OfModerationMultiModalArray: []openai.ModerationMultiModalInputUnionParam{
				{
					OfImageURL: &openai.ModerationImageURLInputParam{
						ImageURL: openai.ModerationImageURLInputImageURLParam{
							URL: "data:image/webp;base64," + base64Image,
						},
						Type: "image_url",
					},
				},
			},
		},
	}
	moderationRes, err := connections.AI.Moderations.New(context.TODO(), params)
	if err != nil {
		logrus.Error("Failed in open AI request")
		return false, err
	}
	return moderationRes.Results[0].Flagged, nil
}

func ModerateText(reviewID uuid.UUID) (bool, error) {
	var review model.Review
	if err := connections.DB.Find(&model.Review{}).Where("review_id = ?", reviewID).First(&review).Error; err != nil {
		logrus.Error("Error fetching review for moderation")
		return false, err
	}
	// var result moderationResponse =
	moderationRes, err := connections.AI.Moderations.New(context.TODO(), openai.ModerationNewParams{
		Model: openai.ModerationModelOmniModeration2024_09_26,
		Input: openai.ModerationNewParamsInputUnion{OfString: param.NewOpt(review.Description)},
	})
	if err != nil {
		logrus.Error("Failed in open AI request")
		return false, err
	}
	return moderationRes.Results[0].Flagged, nil
}
