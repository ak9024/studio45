package handlers

import (
	"api/internal/dto"
	"api/internal/helpers"
	"api/internal/services"
	"errors"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// GetPermission returns a single permission by ID (admin only)
func GetPermission(c *fiber.Ctx) error {
	permissionID := c.Params("id")
	if permissionID == "" {
		return helpers.ValidationErrorResponse(c, "Permission ID is required")
	}

	rbacService := services.NewRBACService()
	
	permission, err := rbacService.GetPermissionByID(permissionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return helpers.NotFoundResponse(c, "Permission not found")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to fetch permission")
	}

	response := dto.PermissionResponse{
		ID:          permission.ID,
		Name:        permission.Name,
		Resource:    permission.Resource,
		Action:      permission.Action,
		Description: permission.Description,
		CreatedAt:   permission.CreatedAt,
		UpdatedAt:   permission.UpdatedAt,
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, response)
}

// CreatePermission creates a new permission (admin only)
func CreatePermission(c *fiber.Ctx) error {
	var req dto.CreatePermissionRequest
	if err := c.BodyParser(&req); err != nil {
		return helpers.ValidationErrorResponse(c, "Invalid request body")
	}

	if err := validate.Struct(req); err != nil {
		return helpers.ValidationErrorResponse(c, helpers.FormatValidationError(err))
	}

	rbacService := services.NewRBACService()
	
	permission, err := rbacService.CreatePermission(req.Name, req.Resource, req.Action, req.Description)
	if err != nil {
		if helpers.IsDuplicateError(err) {
			return helpers.ConflictResponse(c, "Permission name already exists")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to create permission")
	}

	response := dto.PermissionResponse{
		ID:          permission.ID,
		Name:        permission.Name,
		Resource:    permission.Resource,
		Action:      permission.Action,
		Description: permission.Description,
		CreatedAt:   permission.CreatedAt,
		UpdatedAt:   permission.UpdatedAt,
	}

	return helpers.SuccessResponse(c, fiber.StatusCreated, response)
}

// UpdatePermission updates an existing permission (admin only)
func UpdatePermission(c *fiber.Ctx) error {
	permissionID := c.Params("id")
	if permissionID == "" {
		return helpers.ValidationErrorResponse(c, "Permission ID is required")
	}

	var req dto.UpdatePermissionRequest
	if err := c.BodyParser(&req); err != nil {
		return helpers.ValidationErrorResponse(c, "Invalid request body")
	}

	if err := validate.Struct(req); err != nil {
		return helpers.ValidationErrorResponse(c, helpers.FormatValidationError(err))
	}

	// Build updates map for selective updates
	updates := make(map[string]interface{})

	if req.Name != nil {
		updates["name"] = *req.Name
	}

	if req.Resource != nil {
		updates["resource"] = *req.Resource
	}

	if req.Action != nil {
		updates["action"] = *req.Action
	}

	if req.Description != nil {
		updates["description"] = *req.Description
	}

	if len(updates) == 0 {
		return helpers.ValidationErrorResponse(c, "No fields to update")
	}

	rbacService := services.NewRBACService()
	
	permission, err := rbacService.UpdatePermission(permissionID, updates)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return helpers.NotFoundResponse(c, "Permission not found")
		}
		if helpers.IsDuplicateError(err) {
			return helpers.ConflictResponse(c, "Permission name already exists")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to update permission")
	}

	response := dto.PermissionResponse{
		ID:          permission.ID,
		Name:        permission.Name,
		Resource:    permission.Resource,
		Action:      permission.Action,
		Description: permission.Description,
		CreatedAt:   permission.CreatedAt,
		UpdatedAt:   permission.UpdatedAt,
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, response)
}

// DeletePermission deletes a permission (admin only)
func DeletePermission(c *fiber.Ctx) error {
	permissionID := c.Params("id")
	if permissionID == "" {
		return helpers.ValidationErrorResponse(c, "Permission ID is required")
	}

	rbacService := services.NewRBACService()
	
	// Check if permission exists first
	_, err := rbacService.GetPermissionByID(permissionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return helpers.NotFoundResponse(c, "Permission not found")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to fetch permission")
	}

	// Delete the permission
	err = rbacService.DeletePermission(permissionID)
	if err != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to delete permission")
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, dto.MessageResponse{
		Message: "Permission deleted successfully",
	})
}