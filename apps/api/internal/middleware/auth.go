package middleware

import (
	"api/internal/auth"
	"api/internal/helpers"
	"strings"

	"github.com/gofiber/fiber/v2"
)

func RequireAuth() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return helpers.UnauthorizedResponse(c, "Authorization header is required")
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return helpers.UnauthorizedResponse(c, "Invalid authorization header format")
		}

		token := parts[1]
		claims, err := auth.ValidateToken(token)
		if err != nil {
			return helpers.UnauthorizedResponse(c, "Invalid or expired token")
		}

		c.Locals("userID", claims.UserID)
		c.Locals("email", claims.Email)

		return c.Next()
	}
}

func GetUserID(c *fiber.Ctx) string {
	if userID, ok := c.Locals("userID").(string); ok {
		return userID
	}
	return ""
}

func GetUserEmail(c *fiber.Ctx) string {
	if email, ok := c.Locals("email").(string); ok {
		return email
	}
	return ""
}