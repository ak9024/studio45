package database

import (
	"api/internal/helpers"
	applogger "api/internal/logger"
	"fmt"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect() error {
	dsn := helpers.GetEnv("DB_DSN", "postgresql://postgres:postgres@localhost:5432/studio45?sslmode=disable")

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(getLogLevel()),
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get database instance: %w", err)
	}

	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetConnMaxLifetime(5 * time.Minute)

	applogger.Info("Database connected successfully")
	return nil
}

func Migrate(models ...interface{}) error {
	if DB == nil {
		return fmt.Errorf("database not connected")
	}

	err := DB.AutoMigrate(models...)
	if err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	applogger.Info("Database migrations completed", "models_count", len(models))
	return nil
}

func Close() error {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err != nil {
			return err
		}
		return sqlDB.Close()
	}
	return nil
}

func getLogLevel() logger.LogLevel {
	env := os.Getenv("ENV")
	if env == "production" {
		return logger.Error
	}
	return logger.Info
}

