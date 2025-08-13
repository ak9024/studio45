package api

import (
	"fmt"
	"log"
	"os"
	"strconv"

	"api/internal/database"
	"api/internal/server"
	"github.com/joho/godotenv"
	"github.com/spf13/cobra"
)

const (
	defaultPort    = 8080
	defaultService = "Studio45 API"
	defaultVersion = "1.0.0"
)

var (
	port    int
	version string
)

var rootCmd = &cobra.Command{
	Use:           "api",
	Short:         "Studio45 API Server",
	SilenceErrors: true,
	SilenceUsage:  true,
	RunE: func(cmd *cobra.Command, args []string) error {
		cmd.Help()
		return nil
	},
}

var serverCmd = &cobra.Command{
	Use:   "serve",
	Short: "Start the API server",
	Run: func(cmd *cobra.Command, args []string) {
		// Initialize database connection
		log.Println("Connecting to database...")
		dbConfig := database.LoadConfig()
		if err := database.Connect(dbConfig); err != nil {
			log.Fatalf("Failed to connect to database: %v", err)
		}
		defer database.Close()

		// Start server
		config := server.Config{
			Port: port,
		}

		srv := server.New(config)
		if err := srv.Start(); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	},
}

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print the version",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Printf("%s version %s\n", defaultService, version)
	},
}

func init() {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using defaults")
	}

	// Get environment variables with defaults
	envPort := defaultPort
	if p := os.Getenv("PORT"); p != "" {
		if parsedPort, err := strconv.Atoi(p); err == nil {
			envPort = parsedPort
		}
	}

	envVersion := os.Getenv("SERVICE_VERSION")
	if envVersion == "" {
		envVersion = defaultVersion
	}

	// Add commands
	rootCmd.AddCommand(serverCmd)
	rootCmd.AddCommand(versionCmd)
	rootCmd.AddCommand(migrateCmd)

	// Add flags
	serverCmd.Flags().IntVarP(&port, "port", "p", envPort, "Port to run the server on")
	versionCmd.Flags().StringVarP(&version, "version", "v", envVersion, "Service version")

	// Set version for use in version command
	version = envVersion
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		// Show help for unknown commands
		fmt.Fprintf(os.Stderr, "Error: unknown command\n\n")
		rootCmd.Help()
		os.Exit(1)
	}
}
