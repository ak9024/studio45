package handlers

import (
	"api/internal/auth"
	"api/internal/database"
	"api/internal/dto"
	"api/internal/helpers"
	"api/internal/middleware"
	"api/internal/models"
	"api/internal/pkg/phonenumbers"
	"api/internal/services"
	"errors"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// ListUsers returns all users with pagination (admin only)
func ListUsers(c *fiber.Ctx) error {
	// Parse pagination parameters
	var paginationReq dto.PaginationRequest
	if err := c.QueryParser(&paginationReq); err != nil {
		return helpers.ValidationErrorResponse(c, "Invalid pagination parameters")
	}
	
	// Set default values
	if paginationReq.Page <= 0 {
		paginationReq.Page = 1
	}
	if paginationReq.Limit <= 0 {
		paginationReq.Limit = 20
	}
	if paginationReq.Limit > 100 {
		paginationReq.Limit = 100
	}

	rbacService := services.NewRBACService()
	
	// Get users with pagination
	users, total, err := rbacService.GetUsersWithRolesPaginated(
		paginationReq.Page,
		paginationReq.Limit,
		paginationReq.Search,
		paginationReq.SortBy,
		paginationReq.SortDesc,
	)
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

	// Calculate total pages
	totalPages := int((total + int64(paginationReq.Limit) - 1) / int64(paginationReq.Limit))

	response := dto.PaginatedUsersResponse{
		Users:      userResponses,
		Total:      total,
		Page:       paginationReq.Page,
		Limit:      paginationReq.Limit,
		TotalPages: totalPages,
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, response)
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

// CreateUser creates a new user (admin only)
func CreateUser(c *fiber.Ctx) error {
	var req dto.AdminRegisterUserRequest
	if err := c.BodyParser(&req); err != nil {
		return helpers.ValidationErrorResponse(c, "Invalid request body")
	}

	if err := validate.Struct(req); err != nil {
		return helpers.ValidationErrorResponse(c, helpers.FormatValidationError(err))
	}

	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to process password")
	}

	user := models.User{
		Email:    helpers.NormalizeEmail(req.Email),
		Password: hashedPassword,
		Name:     helpers.TrimString(req.Name),
	}

	if req.Phone != nil && *req.Phone != "" {
		normalizedPhone, err := phonenumbers.NormalizeNumber(*req.Phone, phonenumbers.DefaultPhoneRegion)
		if err != nil {
			return helpers.ValidationErrorResponse(c, "Invalid phone number format")
		}
		user.Phone = &normalizedPhone
	}

	if req.Company != nil && *req.Company != "" {
		trimmedCompany := helpers.TrimString(*req.Company)
		user.Company = &trimmedCompany
	}

	result := database.DB.Create(&user)
	if result.Error != nil {
		if helpers.IsDuplicateError(result.Error) {
			return helpers.ConflictResponse(c, "Email already exists")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to create user")
	}

	rbacService := services.NewRBACService()
	currentUserID := middleware.GetUserID(c)

	// Assign roles (default to "user" if no roles specified)
	rolesToAssign := req.Roles
	if len(rolesToAssign) == 0 {
		rolesToAssign = []string{"user"}
	}

	err = rbacService.SetUserRoles(user.ID, rolesToAssign, &currentUserID)
	if err != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to assign roles: "+err.Error())
	}

	// Get created user with roles
	createdUser, err := rbacService.GetUserWithRoles(user.ID)
	if err != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to fetch created user")
	}

	return helpers.SuccessResponse(c, fiber.StatusCreated, dto.UserManagementResponse{
		ID:        createdUser.ID,
		Email:     createdUser.Email,
		Name:      createdUser.Name,
		Phone:     createdUser.Phone,
		Company:   createdUser.Company,
		Roles:     createdUser.GetRoleNames(),
		CreatedAt: createdUser.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt: createdUser.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	})
}
