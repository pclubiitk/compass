// Load environment/config from YAML using Viper
package connections

// TODO: may be in run time i may need to change the configs,
// or api keys how do i do it without again loading the envs

import (
	"github.com/sirupsen/logrus"

	"github.com/spf13/viper"
)

func viperConfig() {
	viper.SetConfigType("yaml")
	viper.AddConfigPath("./")

	viper.SetConfigName("config")
	err := viper.ReadInConfig()
	if err != nil {
		logrus.Fatalf("Fatal error config file: %s \n", err)
		panic(err)
	}

	viper.SetConfigName("secret")

	err = viper.MergeInConfig()
	if err != nil {
		logrus.Errorf("Fatal error secret file: %s \n", err)
	}
}
