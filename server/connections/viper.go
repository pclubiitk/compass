package connections

import (
	
	"sync"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

var (
	initOnce sync.Once
)

// this loads only from secrets.yml
func viperConfig() {
	initOnce.Do(func() {
		// this configures Viper to only use secrets.yml
		viper.SetConfigType("yaml")
		viper.SetConfigName("secrets") 
		viper.AddConfigPath(".")      

		
		if err := viper.ReadInConfig(); err != nil {
			
			if _, ok := err.(viper.ConfigFileNotFoundError); ok {
				logrus.Fatal("secrets.yml file not found. Please create it from secrets.yml.template")
			} else {
				//errors
				logrus.Fatalf("Error reading secrets.yml: %v", err)
			}
		}

	})
}

// this safely retrieves a configuration value
func GetConfig(key string) interface{} {
	return viper.Get(key)
}

/// this gets the config variable values as a string and checks if it is  empty
func GetStringConfig(key string) string {
	val := viper.GetString(key)
	if val == "" {
		logrus.Warnf("Configuration key %s is empty", key)
	}
	return val
}

// Load environment/config from YAML using Viper
// package connections

// // TODO: may be in run time i may need to change the configs,
// // or api keys how do i do it without again loading the envs

// import (
// 	"github.com/sirupsen/logrus"

// 	"github.com/spf13/viper"
// )

// func viperConfig() {
// 	viper.SetConfigType("yaml")
// 	viper.AddConfigPath("./")

// 	viper.SetConfigName("config")
// 	err := viper.ReadInConfig()
// 	if err != nil {
// 		logrus.Fatalf("Fatal error config file: %s \n", err)
// 		panic(err)
// 	}

// 	viper.SetConfigName("secret")

// 	err = viper.MergeInConfig()
// 	if err != nil {
// 		logrus.Errorf("Fatal error secret file: %s \n", err)
// 	}
// }