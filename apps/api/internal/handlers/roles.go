package handlers

import (
	"api/internal/helpers"
	"api/internal/services"

	"github.com/gofiber/fiber/v2"
)

// GetAllRoles returns all available roles (admin only)
func GetAllRoles(c *fiber.Ctx) error {
	rbacService := services.NewRBACService()
	
	roles, err := rbacService.GetAllRoles()
	if err != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to fetch roles")
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, fiber.Map{
		"roles": roles,
		"total": len(roles),
	})
}

// GetUserPermissions returns all permissions for a specific user (admin only)
func GetUserPermissions(c *fiber.Ctx) error {
	userID := c.Params("id")
	if userID == "" {
		return helpers.ValidationErrorResponse(c, "User ID is required")
	}

	rbacService := services.NewRBACService()
	
	// Check if user exists
	_, err := rbacService.GetUserWithRoles(userID)
	if err != nil {
		return helpers.NotFoundResponse(c, "User not found")
	}

	permissions, err := rbacService.GetUserPermissions(userID)
	if err != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to fetch user permissions")
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, fiber.Map{
		"permissions": permissions,
		"total":       len(permissions),
	})
}

// CheckUserPermission checks if a user has a specific permission (admin only)
func CheckUserPermission(c *fiber.Ctx) error {
	userID := c.Params("id")
	permission := c.Params("permission")
	
	if userID == "" || permission == "" {
		return helpers.ValidationErrorResponse(c, "User ID and permission are required")
	}

	rbacService := services.NewRBACService()
	
	hasPermission, err := rbacService.HasPermission(userID, permission)
	if err != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to check permission")
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, fiber.Map{
		"user_id":        userID,
		"permission":     permission,
		"has_permission": hasPermission,
	})
}