package server

import (
	"fmt"
	"log"

	"api/internal/handlers"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/fiber/v2/middleware/requestid"
)

type Config struct {
	Port    int
	Service string
	Version string
}

type Server struct {
	app    *fiber.App
	config Config
}

func New(config Config) *Server {
	app := fiber.New(fiber.Config{
		AppName:      config.Service,
		ErrorHandler: errorHandler,
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
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} - ${latency} ${method} ${path}\n",
	}))
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))
}

func setupRoutes(app *fiber.App, config Config) {
	healthHandler := handlers.HealthCheck(config.Service, config.Version)

	app.Get("/health", healthHandler)

	api := app.Group("/api")
	v1 := api.Group("/v1")

	v1.Get("/health", healthHandler)
}

func errorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "Internal Server Error"

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		message = e.Message
	}

	return c.Status(code).JSON(fiber.Map{
		"error": message,
	})
}

