package handlers

import (
	"runtime"
	"time"

	"github.com/gofiber/fiber/v2"
)

var startTime = time.Now()

func HealthCheck(service, version string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var m runtime.MemStats
		runtime.ReadMemStats(&m)

		return c.JSON(fiber.Map{
			"status":    "ok",
			"service":   service,
			"version":   version,
			"uptime":    time.Since(startTime).Round(time.Second).String(),
			"timestamp": time.Now().Format(time.RFC3339),
			"memory_mb": m.Alloc / 1024 / 1024,
		})
	}
}

