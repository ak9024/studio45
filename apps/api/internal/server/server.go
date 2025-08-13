package server

import (
	"fmt"
	"log"
	"os"
	"strings"

	"api/internal/handlers"
	"api/internal/helpers"
	"api/internal/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/fiber/v2/middleware/requestid"
)

type Config struct {
	Port int
}

type Server struct {
	app    *fiber.App
	config Config
}

func New(config Config) *Server {
	app := fiber.New(fiber.Config{
		ErrorHandler: helpers.ErrorHandler,
	})

	setupMiddleware(app)
	setupRoutes(app, config)

	return &Server{
		app:    app,
		config: config,
	}
}

func (s *Server) Start() error {
	addr := fmt.Sprintf(":%d", s.config.Port)
	log.Printf("🚀 Server starting on http://localhost%s", addr)
	return s.app.Listen(addr)
}

func setupMiddleware(app *fiber.App) {
	app.Use(recover.New())
	app.Use(requestid.New())
	
	// Logger configuration from environment
	logFormat := os.Getenv("LOG_FORMAT")
	if logFormat == "" {
		logFormat = "[${time}] ${status} - ${latency} ${method} ${path}\n"
	}
	app.Use(logger.New(logger.Config{
		Format: logFormat,
	}))
	
	// CORS configuration from environment
	allowOrigins := os.Getenv("CORS_ALLOWED_ORIGINS")
	if allowOrigins == "" {
		allowOrigins = "*"
	}
	
	allowHeaders := os.Getenv("CORS_ALLOWED_HEADERS")
	if allowHeaders == "" {
		allowHeaders = "Origin, Content-Type, Accept, Authorization"
	}
	
	allowMethods := os.Getenv("CORS_ALLOWED_METHODS")
	if allowMethods == "" {
		allowMethods = "GET, POST, PUT, DELETE, OPTIONS"
	}
	
	app.Use(cors.New(cors.Config{
		AllowOrigins: allowOrigins,
		AllowHeaders: allowHeaders,
		AllowMethods: strings.ReplaceAll(allowMethods, " ", ""),
	}))
}

func setupRoutes(app *fiber.App, config Config) {
	healthHandler := handlers.HealthCheck()

	app.Get("/health", healthHandler)

	api := app.Group("/api")
	v1 := api.Group("/v1")

	// Auth routes
	auth := v1.Group("/auth")
	auth.Post("/register", handlers.Register)
	auth.Post("/login", handlers.Login)

	// Protected routes
	protected := v1.Group("/protected")
	protected.Use(middleware.RequireAuth())
	protected.Get("/profile", handlers.GetProfile)
}

