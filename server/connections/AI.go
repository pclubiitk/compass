package connections

import (
	"github.com/openai/openai-go/v2"
	"github.com/openai/openai-go/v2/option"
	"github.com/spf13/viper"
)

var AI openai.Client

func aiConnection() {
	AI = openai.NewClient(
		option.WithAPIKey(viper.GetString("openai.moderation")),
	)
}
