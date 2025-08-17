package connections

import (
	"compass/model"
	"fmt"
	"sync"
	"time"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var (
	DB   *gorm.DB
	dbOnce sync.Once  //  added this to avoid re-calling the database connection multiple times
)

func dbConnection() {
	host := viper.GetString("database.host")
	port := viper.GetString("database.port")
	password := viper.GetString("database.password")
	dbName := viper.GetString("database.name")
	user := viper.GetString("database.user")

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Kolkata",
		host, user, password, dbName, port)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		logrus.Fatal("Failed to connect to database: ", err)
	}

	// setting the up connection pool
	sqlDB, err := DB.DB()
	if err != nil {
		logrus.Fatal("Failed to get database instance: ", err)
	}
	
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)
}

func runMigrations() {
	// this code snippet is added to handle role column migration first since Psql was throwing an error while database connection
	if err := DB.Exec(`
		DO $$
		BEGIN
			ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS chk_users_role;
			ALTER TABLE IF EXISTS users ALTER COLUMN role TYPE text;
			ALTER TABLE IF EXISTS users ALTER COLUMN role TYPE varchar(10);
			ALTER TABLE IF EXISTS users ADD CONSTRAINT chk_users_role CHECK (role IN ('admin', 'bot', 'user'));
		EXCEPTION WHEN others THEN
			RAISE NOTICE 'Migration error: %', SQLERRM;
		END
		$$;
	`).Error; err != nil {
		logrus.Warnf("Migration warning: %v", err)
	}

	models := []interface{}{
		&model.User{},
		&model.Location{},
		&model.Notice{},
		&model.Review{},
		&model.Logs{},
	}

	if err := DB.AutoMigrate(models...); err != nil {
		logrus.Fatal("Failed to auto-migrate models: ", err)
	}

	DB.Exec("CREATE EXTENSION IF NOT EXISTS pgcrypto")
	DB.Exec("CREATE EXTENSION IF NOT EXISTS pg_trgm")
}

func InitDB() {
	dbOnce.Do(func() {
		dbConnection()
		runMigrations()
		logrus.Info("Database connection established")
	})
}
// File for connecting the application to the postgres database
// you may access the database anywhere in the application using connections.DB
// package connections

// import (
// 	"compass/model"
// 	"fmt"

// 	"github.com/sirupsen/logrus"
// 	"github.com/spf13/viper"
// 	"gorm.io/driver/postgres"
// 	"gorm.io/gorm"
// )

// var DB *gorm.DB

// func dbConnection() {
// 	host := viper.GetString("database.host")
// 	port := viper.GetString("database.port")
// 	password := viper.GetString("database.password")
// 	dbName := viper.GetString("database.name")
// 	user := viper.GetString("database.user")

// 	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Kolkata",
// 		host, user, password, dbName, port)

// 	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
// 	if err != nil {
// 		logrus.Fatal("Failed to connect to database: ", err)
// 	}

// 	DB = database

// 	models := []interface{}{
// 		&model.User{},
// 		&model.Location{},
// 		&model.Notice{},
// 		&model.Review{},
// 		&model.Logs{},
// 		&model.Image{},
// 	}

// 	if err := DB.AutoMigrate(models...); err != nil {
// 		logrus.Fatal("Failed to auto-migrate models: ", err)
// 	}
// 	DB.Exec("CREATE EXTENSION IF NOT EXISTS pgcrypto")
// 	DB.Exec("CREATE EXTENSION IF NOT EXISTS pg_trgm")
// 	logrus.Info("Connected to database")
// }