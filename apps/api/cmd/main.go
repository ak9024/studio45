package main

import (
	"fmt"
	"log"
	"os"
	"strconv"

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
	service string
	version string
)

var rootCmd = &cobra.Command{
	Use:   "studio45",
	Short: "Studio45 API Server",
}

var serverCmd = &cobra.Command{
	Use:   "server",
	Short: "Start the API server",
	Run: func(cmd *cobra.Command, args []string) {
		config := server.Config{
			Port:    port,
			Service: service,
			Version: version,
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
		fmt.Printf("%s version %s\n", service, version)
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
		if port, err := strconv.Atoi(p); err == nil {
			envPort = port
		}
	}

	envService := os.Getenv("SERVICE_NAME")
	if envService == "" {
		envService = defaultService
	}

	envVersion := os.Getenv("SERVICE_VERSION")
	if envVersion == "" {
		envVersion = defaultVersion
	}

	rootCmd.AddCommand(serverCmd)
	rootCmd.AddCommand(versionCmd)

	serverCmd.Flags().IntVarP(&port, "port", "p", envPort, "Port to run the server on")
	serverCmd.Flags().StringVarP(&service, "service", "s", envService, "Service name")
	serverCmd.Flags().StringVarP(&version, "version", "v", envVersion, "Service version")
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
