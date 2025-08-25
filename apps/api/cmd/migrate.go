package api

import (
	"fmt"
	"os"
	"strconv"

	"api/internal/helpers"
	"api/internal/logger"
	"api/internal/migration"
	"github.com/spf13/cobra"
)

var migrateCmd = &cobra.Command{
	Use:   "migrate",
	Short: "Database migration commands",
	Long:  "Manage database migrations including creating new migrations, applying, and rolling back",
}

var migrateUpCmd = &cobra.Command{
	Use:   "up",
	Short: "Apply all pending migrations",
	RunE: func(cmd *cobra.Command, args []string) error {
		return runMigration(func(m *migration.Manager) error {
			return m.Up()
		})
	},
}

var migrateDownCmd = &cobra.Command{
	Use:   "down",
	Short: "Rollback all migrations",
	RunE: func(cmd *cobra.Command, args []string) error {
		return runMigration(func(m *migration.Manager) error {
			return m.Down()
		})
	},
}

var migrateStepsCmd = &cobra.Command{
	Use:   "steps [n]",
	Short: "Apply or rollback n migration steps (negative for rollback)",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		n, err := strconv.Atoi(args[0])
		if err != nil {
			return fmt.Errorf("invalid number of steps: %w", err)
		}

		return runMigration(func(m *migration.Manager) error {
			return m.Steps(n)
		})
	},
}

var migrateStatusCmd = &cobra.Command{
	Use:   "status",
	Short: "Show current migration version",
	RunE: func(cmd *cobra.Command, args []string) error {
		return runMigration(func(m *migration.Manager) error {
			version, dirty, err := m.Version()
			if err != nil {
				return err
			}

			status := "clean"
			if dirty {
				status = "dirty"
			}

			logger.Info("Current migration version", "version", version, "status", status)
			return nil
		})
	},
}

var migrateVersionCmd = &cobra.Command{
	Use:   "version",
	Short: "Show current migration version",
	RunE: func(cmd *cobra.Command, args []string) error {
		return runMigration(func(m *migration.Manager) error {
			version, dirty, err := m.Version()
			if err != nil {
				return err
			}

			status := "clean"
			if dirty {
				status = "dirty"
			}

			fmt.Printf("%d (%s)\n", version, status)
			return nil
		})
	},
}

var migrateForceCmd = &cobra.Command{
	Use:   "force [version]",
	Short: "Force set migration version (use with caution)",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		version, err := strconv.Atoi(args[0])
		if err != nil {
			return fmt.Errorf("invalid version number: %w", err)
		}

		return runMigration(func(m *migration.Manager) error {
			return m.Force(version)
		})
	},
}

var migrateCreateCmd = &cobra.Command{
	Use:   "create [name]",
	Short: "Create a new migration file",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		migrationPath := os.Getenv("MIGRATION_PATH")
		if migrationPath == "" {
			migrationPath = "migrations"
		}

		return migration.CreateMigration(args[0], migrationPath)
	},
}

func init() {
	migrateCmd.AddCommand(migrateUpCmd)
	migrateCmd.AddCommand(migrateDownCmd)
	migrateCmd.AddCommand(migrateStepsCmd)
	migrateCmd.AddCommand(migrateStatusCmd)
	migrateCmd.AddCommand(migrateVersionCmd)
	migrateCmd.AddCommand(migrateForceCmd)
	migrateCmd.AddCommand(migrateCreateCmd)
}

func runMigration(fn func(*migration.Manager) error) error {
	databaseURL := helpers.GetEnv("DB_DSN", "postgresql://postgres:postgres@localhost:5432/studio45?sslmode=disable")

	migrationPath := os.Getenv("MIGRATION_PATH")
	if migrationPath == "" {
		migrationPath = "migrations"
	}

	config := migration.Config{
		DatabaseURL:   databaseURL,
		MigrationPath: migrationPath,
	}

	manager := migration.NewManager(config)
	if err := manager.Initialize(); err != nil {
		return fmt.Errorf("failed to initialize migration manager: %w", err)
	}
	defer manager.Close()

	return fn(manager)
}
