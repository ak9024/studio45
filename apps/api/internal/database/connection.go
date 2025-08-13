package database

import (
	"api/internal/helpers"
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

type Config struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

func LoadConfig() Config {
	return Config{
		Host:     helpers.GetEnv("DB_HOST", "localhost"),
		Port:     helpers.GetEnv("DB_PORT", "5432"),
		User:     helpers.GetEnv("DB_USER", "postgres"),
		Password: helpers.GetEnv("DB_PASSWORD", "postgres"),
		DBName:   helpers.GetEnv("DB_NAME", "studio45"),
		SSLMode:  helpers.GetEnv("DB_SSLMODE", "disable"),
	}
}

func Connect(config Config) error {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		config.Host, config.User, config.Password, config.DBName, config.Port, config.SSLMode)

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

	log.Println("✅ Database connected successfully")
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
	
	log.Println("✅ Database migrations completed")
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