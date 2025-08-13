package main

import (
	"flag"
	"log"
	"os"
	"strconv"

	"api/internal/server"
	"github.com/joho/godotenv"
)

const (
	defaultPort    = 8080
	defaultService = "Studio45 API"
	defaultVersion = "1.0.0"
)

func main() {
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

	var (
		port    = flag.Int("port", envPort, "Server port")
		service = flag.String("service", envService, "Service name")
		version = flag.String("version", envVersion, "Service version")
	)
	flag.Parse()

	config := server.Config{
		Port:    *port,
		Service: *service,
		Version: *version,
	}

	srv := server.New(config)
	if err := srv.Start(); err != nil {
		log.Printf("Failed to start server: %v", err)
		os.Exit(1)
	}
}