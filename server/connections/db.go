// File for connecting the application to the postgres database
// you may access the database anywhere in the application using connections.DB
package connections

import (
	"compass/model"
	"fmt"

	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func dbConnection() {
	host := viper.GetString("database.host")
	port := viper.GetString("database.port")
	password := viper.GetString("database.password")
	dbName := viper.GetString("database.name")
	user := viper.GetString("database.user")

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Kolkata",
		host, user, password, dbName, port)

	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		logrus.Fatal("Failed to connect to database: ", err)
	}

	DB = database

	models := []interface{}{
		&model.User{},
		&model.Location{},
		&model.Notice{},
		&model.Review{},
		&model.Logs{},
		&model.Image{},
		&model.Profile{},
		&model.ChangeLog{},
	}

	if err := DB.AutoMigrate(models...); err != nil {
		logrus.Fatal("Failed to auto-migrate models: ", err)
	}
	DB.Exec("CREATE EXTENSION IF NOT EXISTS pgcrypto")
	DB.Exec("CREATE EXTENSION IF NOT EXISTS pg_trgm")
	logrus.Info("Connected to database")
}
