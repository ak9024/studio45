package server

import (
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

// RouterConfig holds configuration for the router
type RouterConfig struct {
	// Add any router-specific configuration here
	EnableHealthCheck bool
	APIPrefix         string
}

// DefaultRouterConfig returns default router configuration
func DefaultRouterConfig() RouterConfig {
	return RouterConfig{
		EnableHealthCheck: true,
		APIPrefix:         "/api",
	}
}

// NewRouter creates a new configured Fiber app with all routes and middleware
func NewRouter() *fiber.App {
	return NewRouterWithConfig(DefaultRouterConfig())
}

// NewRouterWithConfig creates a new configured Fiber app with custom config
func NewRouterWithConfig(config RouterConfig) *fiber.App {
	app := fiber.New(fiber.Config{
		ErrorHandler: helpers.ErrorHandler,
	})

	setupMiddleware(app)
	setupRoutes(app, config)

	return app
}

func setupMiddleware(app *fiber.App) {
	app.Use(recover.New())
	app.Use(requestid.New())
	
	// Logger configuration from environment
	logFormat := helpers.GetEnv("LOG_FORMAT", "[${time}] ${status} - ${latency} ${method} ${path}\n")
	app.Use(logger.New(logger.Config{
		Format: logFormat,
	}))
	
	// CORS configuration from environment
	allowOrigins := helpers.GetEnv("CORS_ALLOWED_ORIGINS", "*")
	allowHeaders := helpers.GetEnv("CORS_ALLOWED_HEADERS", "Origin, Content-Type, Accept, Authorization")
	allowMethods := helpers.GetEnv("CORS_ALLOWED_METHODS", "GET, POST, PUT, DELETE, OPTIONS")
	
	app.Use(cors.New(cors.Config{
		AllowOrigins: allowOrigins,
		AllowHeaders: allowHeaders,
		AllowMethods: strings.ReplaceAll(allowMethods, " ", ""),
	}))
}

func setupRoutes(app *fiber.App, config RouterConfig) {
	// Health check route (optional)
	if config.EnableHealthCheck {
		healthHandler := handlers.HealthCheck()
		app.Get("/health", healthHandler)
	}

	// API routes
	api := app.Group(config.APIPrefix)
	v1 := api.Group("/v1")

	// Auth routes
	auth := v1.Group("/auth")
	auth.Post("/register", handlers.Register)
	auth.Post("/login", handlers.Login)
	auth.Post("/forgot-password", handlers.ForgotPassword)
	auth.Post("/reset-password", handlers.ResetPassword)

	// Protected routes
	protected := v1.Group("/protected")
	protected.Use(middleware.RequireAuth())
	protected.Get("/profile", handlers.GetProfile)
	protected.Put("/profile", handlers.UpdateProfile)

	// Admin routes
	admin := v1.Group("/admin")
	admin.Use(middleware.RequireAuth())
	admin.Use(middleware.RequireAdmin())
	
	// User management
	admin.Get("/users", handlers.ListUsers)
	admin.Post("/users", handlers.CreateUser)
	admin.Put("/users/:id", handlers.UpdateUser)
	admin.Put("/users/:id/roles", handlers.UpdateUserRoles)
	admin.Delete("/users/:id", handlers.DeleteUser)
	
	// Role and permission management
	admin.Get("/roles", handlers.GetAllRoles)
	admin.Post("/roles", handlers.CreateRole)
	admin.Get("/roles/:id", handlers.GetRole)
	admin.Put("/roles/:id", handlers.UpdateRole)
	admin.Delete("/roles/:id", handlers.DeleteRole)
	admin.Get("/roles/:id/permissions", handlers.GetRolePermissions)
	admin.Put("/roles/:id/permissions", handlers.UpdateRolePermissions)
	
	admin.Get("/permissions", handlers.GetAllPermissions)
	admin.Post("/permissions", handlers.CreatePermission)
	admin.Get("/permissions/:id", handlers.GetPermission)
	admin.Put("/permissions/:id", handlers.UpdatePermission)
	admin.Delete("/permissions/:id", handlers.DeletePermission)
	
	admin.Get("/users/:id/permissions", handlers.GetUserPermissions)
	admin.Get("/users/:id/permissions/:permission", handlers.CheckUserPermission)
}