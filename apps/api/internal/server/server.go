package server

import (
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
)

type Config struct {
	Port int
}

type Server struct {
	app    *fiber.App
	config Config
}

// New creates a new server with the default router
func New(config Config) *Server {
	app := NewRouter()

	return &Server{
		app:    app,
		config: config,
	}
}

// NewWithRouter creates a new server with a custom router
func NewWithRouter(app *fiber.App, config Config) *Server {
	return &Server{
		app:    app,
		config: config,
	}
}

// GetApp returns the underlying Fiber app instance
// This allows external code to access the router for testing or additional configuration
func (s *Server) GetApp() *fiber.App {
	return s.app
}

// Start starts the HTTP server on the configured port
func (s *Server) Start() error {
	addr := fmt.Sprintf(":%d", s.config.Port)
	log.Printf("🚀 Server starting on http://localhost%s", addr)
	return s.app.Listen(addr)
}

// Shutdown gracefully shuts down the server
func (s *Server) Shutdown() error {
	return s.app.Shutdown()
}
