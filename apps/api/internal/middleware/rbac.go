package middleware

import (
	"api/internal/helpers"

	"github.com/gofiber/fiber/v2"
)

// RequireRole checks if the user has a specific role
func RequireRole(role string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		roles := GetUserRoles(c)
		if roles == nil {
			return helpers.ForbiddenResponse(c, "Access denied: no roles found")
		}

		for _, userRole := range roles {
			if userRole == role {
				return c.Next()
			}
		}

		return helpers.ForbiddenResponse(c, "Access denied: insufficient permissions")
	}
}

// RequireAnyRole checks if the user has any of the specified roles
func RequireAnyRole(requiredRoles []string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		roles := GetUserRoles(c)
		if roles == nil {
			return helpers.ForbiddenResponse(c, "Access denied: no roles found")
		}

		for _, userRole := range roles {
			for _, requiredRole := range requiredRoles {
				if userRole == requiredRole {
					return c.Next()
				}
			}
		}

		return helpers.ForbiddenResponse(c, "Access denied: insufficient permissions")
	}
}

// RequireAllRoles checks if the user has all of the specified roles
func RequireAllRoles(requiredRoles []string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		roles := GetUserRoles(c)
		if roles == nil {
			return helpers.ForbiddenResponse(c, "Access denied: no roles found")
		}

		roleMap := make(map[string]bool)
		for _, userRole := range roles {
			roleMap[userRole] = true
		}

		for _, requiredRole := range requiredRoles {
			if !roleMap[requiredRole] {
				return helpers.ForbiddenResponse(c, "Access denied: insufficient permissions")
			}
		}

		return c.Next()
	}
}

// GetUserRoles retrieves user roles from the context
func GetUserRoles(c *fiber.Ctx) []string {
	if roles, ok := c.Locals("userRoles").([]string); ok {
		return roles
	}
	return nil
}

// RequireAdmin is a convenience middleware for admin-only routes
func RequireAdmin() fiber.Handler {
	return RequireRole("admin")
}