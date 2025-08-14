package handlers

import (
	"api/internal/dto"
	"api/internal/helpers"
	"api/internal/middleware"
	"api/internal/pkg/phonenumbers"
	"api/internal/services"
	"errors"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// ListUsers returns all users (admin only)
func ListUsers(c *fiber.Ctx) error {
	rbacService := services.NewRBACService()
	
	// Get all users with their roles
	users, err := rbacService.GetAllUsersWithRoles()
	if err != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to fetch users")
	}

	var userResponses []dto.UserManagementResponse
	for _, user := range users {
		userResponses = append(userResponses, dto.UserManagementResponse{
			ID:        user.ID,
			Email:     user.Email,
			Name:      user.Name,
			Phone:     user.Phone,
			Company:   user.Company,
			Roles:     user.GetRoleNames(),
			CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z"),
			UpdatedAt: user.UpdatedAt.Format("2006-01-02T15:04:05Z"),
		})
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, fiber.Map{
		"users": userResponses,
		"total": len(userResponses),
	})
}

// UpdateUserRoles updates a user's roles (admin only)
func UpdateUserRoles(c *fiber.Ctx) error {
	userID := c.Params("id")
	if userID == "" {
		return helpers.ValidationErrorResponse(c, "User ID is required")
	}

	var req dto.UpdateRolesRequest
	if err := c.BodyParser(&req); err != nil {
		return helpers.ValidationErrorResponse(c, "Invalid request body")
	}

	if err := validate.Struct(req); err != nil {
		return helpers.ValidationErrorResponse(c, helpers.FormatValidationError(err))
	}

	rbacService := services.NewRBACService()

	// Check if user exists
	_, err := rbacService.GetUserWithRoles(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return helpers.NotFoundResponse(c, "User not found")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to fetch user")
	}

	// Prevent admin from removing their own admin role
	currentUserID := middleware.GetUserID(c)
	currentUserRoles := middleware.GetUserRoles(c)
	if userID == currentUserID {
		hasAdmin := false
		for _, role := range req.Roles {
			if role == "admin" {
				hasAdmin = true
				break
			}
		}
		if !hasAdmin {
			// Check if current user is admin
			currentIsAdmin := false
			for _, role := range currentUserRoles {
				if role == "admin" {
					currentIsAdmin = true
					break
				}
			}
			if currentIsAdmin {
				return helpers.ValidationErrorResponse(c, "Cannot remove admin role from yourself")
			}
		}
	}

	// Update user roles
	grantedBy := currentUserID
	err = rbacService.SetUserRoles(userID, req.Roles, &grantedBy)
	if err != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to update user roles: " + err.Error())
	}

	// Get updated user
	updatedUser, err := rbacService.GetUserWithRoles(userID)
	if err != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to fetch updated user")
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, dto.UserManagementResponse{
		ID:        updatedUser.ID,
		Email:     updatedUser.Email,
		Name:      updatedUser.Name,
		Phone:     updatedUser.Phone,
		Company:   updatedUser.Company,
		Roles:     updatedUser.GetRoleNames(),
		CreatedAt: updatedUser.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt: updatedUser.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	})
}

// DeleteUser deletes a user (admin only)
func DeleteUser(c *fiber.Ctx) error {
	userID := c.Params("id")
	if userID == "" {
		return helpers.ValidationErrorResponse(c, "User ID is required")
	}

	// Prevent admin from deleting themselves
	currentUserID := middleware.GetUserID(c)
	if userID == currentUserID {
		return helpers.ValidationErrorResponse(c, "Cannot delete yourself")
	}

	rbacService := services.NewRBACService()

	// Check if user exists
	_, err := rbacService.GetUserWithRoles(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return helpers.NotFoundResponse(c, "User not found")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to fetch user")
	}

	// Soft delete the user (GORM will handle role relationships via ON DELETE CASCADE)
	err = rbacService.DeleteUser(userID)
	if err != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to delete user")
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, dto.MessageResponse{
		Message: "User deleted successfully",
	})
}

// UpdateUser updates user information (admin only)
func UpdateUser(c *fiber.Ctx) error {
	userID := c.Params("id")
	if userID == "" {
		return helpers.ValidationErrorResponse(c, "User ID is required")
	}

	var req dto.UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return helpers.ValidationErrorResponse(c, "Invalid request body")
	}

	if err := validate.Struct(req); err != nil {
		return helpers.ValidationErrorResponse(c, helpers.FormatValidationError(err))
	}

	rbacService := services.NewRBACService()

	// Check if user exists
	_, err := rbacService.GetUserWithRoles(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return helpers.NotFoundResponse(c, "User not found")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to fetch user")
	}

	// Build updates map for selective updates
	updates := make(map[string]interface{})

	if req.Email != nil {
		updates["email"] = *req.Email
	}

	if req.Name != nil {
		updates["name"] = *req.Name
	}

	if req.Phone != nil {
		if *req.Phone == "" {
			updates["phone"] = nil
		} else {
			if !phonenumbers.IsValidNumber(*req.Phone, phonenumbers.DefaultPhoneRegion) {
				return helpers.ValidationErrorResponse(c, "Invalid phone number format")
			}
			normalizedPhone, err := phonenumbers.NormalizeNumber(*req.Phone, phonenumbers.DefaultPhoneRegion)
			if err != nil {
				return helpers.ValidationErrorResponse(c, "Invalid phone number format")
			}
			updates["phone"] = normalizedPhone
		}
	}

	if req.Company != nil {
		if *req.Company == "" {
			updates["company"] = nil
		} else {
			updates["company"] = *req.Company
		}
	}

	// Update user if there are changes
	if len(updates) > 0 {
		err = rbacService.UpdateUser(userID, updates)
		if err != nil {
			if helpers.IsDuplicateError(err) && req.Email != nil {
				return helpers.ValidationErrorResponse(c, "Email already exists")
			}
			return helpers.InternalServerErrorResponse(c, "Failed to update user")
		}
	}

	// Get updated user
	updatedUser, err := rbacService.GetUserWithRoles(userID)
	if err != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to fetch updated user")
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, dto.UserManagementResponse{
		ID:        updatedUser.ID,
		Email:     updatedUser.Email,
		Name:      updatedUser.Name,
		Phone:     updatedUser.Phone,
		Company:   updatedUser.Company,
		Roles:     updatedUser.GetRoleNames(),
		CreatedAt: updatedUser.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt: updatedUser.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	})
}