package handlers

import (
	"api/internal/dto"
	"api/internal/helpers"
	"api/internal/services"
	"errors"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
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

// GetAllPermissions returns all available permissions (admin only)
func GetAllPermissions(c *fiber.Ctx) error {
	rbacService := services.NewRBACService()
	
	permissions, err := rbacService.GetAllPermissions()
	if err != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to fetch permissions")
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, fiber.Map{
		"permissions": permissions,
		"total":       len(permissions),
	})
}

// GetRole returns a single role with permissions by ID (admin only)
func GetRole(c *fiber.Ctx) error {
	roleID := c.Params("id")
	if roleID == "" {
		return helpers.ValidationErrorResponse(c, "Role ID is required")
	}

	rbacService := services.NewRBACService()
	
	role, err := rbacService.GetRoleByIDWithPermissions(roleID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return helpers.NotFoundResponse(c, "Role not found")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to fetch role")
	}

	// Convert permissions to response format
	var permissions []dto.PermissionResponse
	for _, p := range role.Permissions {
		permissions = append(permissions, dto.PermissionResponse{
			ID:          p.ID,
			Name:        p.Name,
			Resource:    p.Resource,
			Action:      p.Action,
			Description: p.Description,
			CreatedAt:   p.CreatedAt,
			UpdatedAt:   p.UpdatedAt,
		})
	}

	response := dto.RoleResponse{
		ID:          role.ID,
		Name:        role.Name,
		Description: role.Description,
		Permissions: permissions,
		CreatedAt:   role.CreatedAt,
		UpdatedAt:   role.UpdatedAt,
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, response)
}

// GetRolePermissions returns permissions for a specific role (admin only)
func GetRolePermissions(c *fiber.Ctx) error {
	roleID := c.Params("id")
	if roleID == "" {
		return helpers.ValidationErrorResponse(c, "Role ID is required")
	}

	rbacService := services.NewRBACService()
	
	role, err := rbacService.GetRoleByIDWithPermissions(roleID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return helpers.NotFoundResponse(c, "Role not found")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to fetch role")
	}

	// Convert permissions to response format
	var permissions []dto.PermissionResponse
	for _, p := range role.Permissions {
		permissions = append(permissions, dto.PermissionResponse{
			ID:          p.ID,
			Name:        p.Name,
			Resource:    p.Resource,
			Action:      p.Action,
			Description: p.Description,
			CreatedAt:   p.CreatedAt,
			UpdatedAt:   p.UpdatedAt,
		})
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, fiber.Map{
		"permissions": permissions,
		"total":       len(permissions),
	})
}

// CreateRole creates a new role (admin only)
func CreateRole(c *fiber.Ctx) error {
	var req dto.CreateRoleRequest
	if err := c.BodyParser(&req); err != nil {
		return helpers.ValidationErrorResponse(c, "Invalid request body")
	}

	if err := validate.Struct(req); err != nil {
		return helpers.ValidationErrorResponse(c, helpers.FormatValidationError(err))
	}

	rbacService := services.NewRBACService()
	
	role, err := rbacService.CreateRole(req.Name, req.Description)
	if err != nil {
		if helpers.IsDuplicateError(err) {
			return helpers.ConflictResponse(c, "Role name already exists")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to create role")
	}

	response := dto.RoleResponse{
		ID:          role.ID,
		Name:        role.Name,
		Description: role.Description,
		Permissions: []dto.PermissionResponse{}, // New roles have no permissions initially
		CreatedAt:   role.CreatedAt,
		UpdatedAt:   role.UpdatedAt,
	}

	return helpers.SuccessResponse(c, fiber.StatusCreated, response)
}

// UpdateRole updates an existing role (admin only)
func UpdateRole(c *fiber.Ctx) error {
	roleID := c.Params("id")
	if roleID == "" {
		return helpers.ValidationErrorResponse(c, "Role ID is required")
	}

	var req dto.UpdateRoleRequest
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

	if req.Description != nil {
		updates["description"] = *req.Description
	}

	if len(updates) == 0 {
		return helpers.ValidationErrorResponse(c, "No fields to update")
	}

	rbacService := services.NewRBACService()
	
	_, err := rbacService.UpdateRole(roleID, updates)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return helpers.NotFoundResponse(c, "Role not found")
		}
		if helpers.IsDuplicateError(err) {
			return helpers.ConflictResponse(c, "Role name already exists")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to update role")
	}

	// Get updated role with permissions
	updatedRole, err := rbacService.GetRoleByIDWithPermissions(roleID)
	if err != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to fetch updated role")
	}

	// Convert permissions to response format
	var permissions []dto.PermissionResponse
	for _, p := range updatedRole.Permissions {
		permissions = append(permissions, dto.PermissionResponse{
			ID:          p.ID,
			Name:        p.Name,
			Resource:    p.Resource,
			Action:      p.Action,
			Description: p.Description,
			CreatedAt:   p.CreatedAt,
			UpdatedAt:   p.UpdatedAt,
		})
	}

	response := dto.RoleResponse{
		ID:          updatedRole.ID,
		Name:        updatedRole.Name,
		Description: updatedRole.Description,
		Permissions: permissions,
		CreatedAt:   updatedRole.CreatedAt,
		UpdatedAt:   updatedRole.UpdatedAt,
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, response)
}

// DeleteRole deletes a role (admin only)
func DeleteRole(c *fiber.Ctx) error {
	roleID := c.Params("id")
	if roleID == "" {
		return helpers.ValidationErrorResponse(c, "Role ID is required")
	}

	rbacService := services.NewRBACService()
	
	// Check if role exists first
	_, err := rbacService.GetRoleByIDWithPermissions(roleID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return helpers.NotFoundResponse(c, "Role not found")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to fetch role")
	}

	// Delete the role
	err = rbacService.DeleteRole(roleID)
	if err != nil {
		if err.Error() == "cannot delete system role: admin" || err.Error() == "cannot delete system role: user" {
			return helpers.ValidationErrorResponse(c, err.Error())
		}
		return helpers.InternalServerErrorResponse(c, "Failed to delete role")
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, dto.MessageResponse{
		Message: "Role deleted successfully",
	})
}

// UpdateRolePermissions updates permissions for a role (admin only)
func UpdateRolePermissions(c *fiber.Ctx) error {
	roleID := c.Params("id")
	if roleID == "" {
		return helpers.ValidationErrorResponse(c, "Role ID is required")
	}

	var req dto.AssignPermissionsToRoleRequest
	if err := c.BodyParser(&req); err != nil {
		return helpers.ValidationErrorResponse(c, "Invalid request body")
	}

	if err := validate.Struct(req); err != nil {
		return helpers.ValidationErrorResponse(c, helpers.FormatValidationError(err))
	}

	rbacService := services.NewRBACService()
	
	// Check if role exists
	_, err := rbacService.GetRoleByIDWithPermissions(roleID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return helpers.NotFoundResponse(c, "Role not found")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to fetch role")
	}

	// Update role permissions
	err = rbacService.SetRolePermissions(roleID, req.PermissionIDs)
	if err != nil {
		if err.Error() == "cannot remove admin.access permission from admin role" {
			return helpers.ValidationErrorResponse(c, err.Error())
		}
		return helpers.InternalServerErrorResponse(c, "Failed to update role permissions: " + err.Error())
	}

	// Get updated role with permissions
	updatedRole, err := rbacService.GetRoleByIDWithPermissions(roleID)
	if err != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to fetch updated role")
	}

	// Convert permissions to response format
	var permissions []dto.PermissionResponse
	for _, p := range updatedRole.Permissions {
		permissions = append(permissions, dto.PermissionResponse{
			ID:          p.ID,
			Name:        p.Name,
			Resource:    p.Resource,
			Action:      p.Action,
			Description: p.Description,
			CreatedAt:   p.CreatedAt,
			UpdatedAt:   p.UpdatedAt,
		})
	}

	response := dto.RoleResponse{
		ID:          updatedRole.ID,
		Name:        updatedRole.Name,
		Description: updatedRole.Description,
		Permissions: permissions,
		CreatedAt:   updatedRole.CreatedAt,
		UpdatedAt:   updatedRole.UpdatedAt,
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, response)
}