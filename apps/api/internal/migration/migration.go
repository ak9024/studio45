package migration

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/lib/pq"
)

type Config struct {
	DatabaseURL   string
	MigrationPath string
}

type Manager struct {
	config  Config
	migrate *migrate.Migrate
}

func NewManager(config Config) *Manager {
	return &Manager{
		config: config,
	}
}

func (m *Manager) Initialize() error {
	if m.config.MigrationPath == "" {
		m.config.MigrationPath = "migrations"
	}

	absPath, err := filepath.Abs(m.config.MigrationPath)
	if err != nil {
		return fmt.Errorf("failed to get absolute path: %w", err)
	}

	sourceURL := fmt.Sprintf("file://%s", absPath)

	db, err := sql.Open("postgres", m.config.DatabaseURL)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("failed to create driver: %w", err)
	}

	m.migrate, err = migrate.NewWithDatabaseInstance(
		sourceURL,
		"postgres",
		driver,
	)
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}

	return nil
}

func (m *Manager) Up() error {
	if m.migrate == nil {
		return errors.New("migration manager not initialized")
	}

	err := m.migrate.Up()
	if err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	if errors.Is(err, migrate.ErrNoChange) {
		log.Println("No new migrations to apply")
	} else {
		log.Println("✅ Migrations applied successfully")
	}

	return nil
}

func (m *Manager) Down() error {
	if m.migrate == nil {
		return errors.New("migration manager not initialized")
	}

	err := m.migrate.Down()
	if err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("failed to rollback migrations: %w", err)
	}

	if errors.Is(err, migrate.ErrNoChange) {
		log.Println("No migrations to rollback")
	} else {
		log.Println("✅ Migrations rolled back successfully")
	}

	return nil
}

func (m *Manager) Steps(n int) error {
	if m.migrate == nil {
		return errors.New("migration manager not initialized")
	}

	if n > 0 {
		err := m.migrate.Steps(n)
		if err != nil && !errors.Is(err, migrate.ErrNoChange) {
			return fmt.Errorf("failed to run %d migration steps: %w", n, err)
		}
		log.Printf("✅ Applied %d migration steps", n)
	} else if n < 0 {
		err := m.migrate.Steps(n)
		if err != nil && !errors.Is(err, migrate.ErrNoChange) {
			return fmt.Errorf("failed to rollback %d migration steps: %w", -n, err)
		}
		log.Printf("✅ Rolled back %d migration steps", -n)
	}

	return nil
}

func (m *Manager) Version() (uint, bool, error) {
	if m.migrate == nil {
		return 0, false, errors.New("migration manager not initialized")
	}

	version, dirty, err := m.migrate.Version()
	if err != nil && !errors.Is(err, migrate.ErrNilVersion) {
		return 0, false, fmt.Errorf("failed to get version: %w", err)
	}

	return version, dirty, nil
}

func (m *Manager) Force(version int) error {
	if m.migrate == nil {
		return errors.New("migration manager not initialized")
	}

	err := m.migrate.Force(version)
	if err != nil {
		return fmt.Errorf("failed to force version: %w", err)
	}

	log.Printf("✅ Forced migration version to %d", version)
	return nil
}

func (m *Manager) Close() error {
	if m.migrate != nil {
		sourceErr, dbErr := m.migrate.Close()
		if sourceErr != nil {
			return fmt.Errorf("failed to close source: %w", sourceErr)
		}
		if dbErr != nil {
			return fmt.Errorf("failed to close database: %w", dbErr)
		}
	}
	return nil
}

func CreateMigration(name string, migrationPath string) error {
	if migrationPath == "" {
		migrationPath = "migrations"
	}

	if err := os.MkdirAll(migrationPath, 0755); err != nil {
		return fmt.Errorf("failed to create migrations directory: %w", err)
	}

	timestamp := time.Now().Unix()
	version := fmt.Sprintf("%06d", timestamp)

	upFile := filepath.Join(migrationPath, fmt.Sprintf("%s_%s.up.sql", version, name))
	downFile := filepath.Join(migrationPath, fmt.Sprintf("%s_%s.down.sql", version, name))

	upContent := fmt.Sprintf("-- Migration: %s\n-- Created at: %s\n\n", name, time.Now().Format(time.RFC3339))
	downContent := fmt.Sprintf("-- Rollback: %s\n-- Created at: %s\n\n", name, time.Now().Format(time.RFC3339))

	if err := os.WriteFile(upFile, []byte(upContent), 0644); err != nil {
		return fmt.Errorf("failed to create up migration file: %w", err)
	}

	if err := os.WriteFile(downFile, []byte(downContent), 0644); err != nil {
		return fmt.Errorf("failed to create down migration file: %w", err)
	}

	log.Printf("✅ Created migration files:\n  - %s\n  - %s", upFile, downFile)
	return nil
}