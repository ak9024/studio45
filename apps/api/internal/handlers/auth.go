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

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var validate = validator.New()

func init() {
	if err := helpers.RegisterCustomValidators(validate); err != nil {
		panic("Failed to register custom validators: " + err.Error())
	}
}

func Register(c *fiber.Ctx) error {
	var req dto.RegisterRequest
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

	result := database.DB.Create(&user)
	if result.Error != nil {
		if helpers.IsDuplicateError(result.Error) {
			return helpers.ConflictResponse(c, "Email already exists")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to create user")
	}

	// Assign default user role
	rbacService := services.NewRBACService()
	err = rbacService.AssignRoleToUser(user.ID, "user", nil)
	if err != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to assign default role")
	}

	token, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to generate token")
	}

	return helpers.SuccessResponse(c, fiber.StatusCreated, dto.AuthResponse{
		Token: token,
		User: dto.UserResponse{
			ID:    user.ID,
			Email: user.Email,
			Name:  user.Name,
		},
	})
}

func Login(c *fiber.Ctx) error {
	var req dto.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return helpers.ValidationErrorResponse(c, "Invalid request body")
	}

	if err := validate.Struct(req); err != nil {
		return helpers.ValidationErrorResponse(c, helpers.FormatValidationError(err))
	}

	var user models.User
	result := database.DB.Where("email = ?", helpers.NormalizeEmail(req.Email)).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return helpers.UnauthorizedResponse(c, "Invalid email or password")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to process request")
	}

	if !auth.CheckPassword(req.Password, user.Password) {
		return helpers.UnauthorizedResponse(c, "Invalid email or password")
	}

	token, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to generate token")
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, dto.AuthResponse{
		Token: token,
		User: dto.UserResponse{
			ID:    user.ID,
			Email: user.Email,
			Name:  user.Name,
		},
	})
}

func GetProfile(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	if userID == "" {
		return helpers.UnauthorizedResponse(c, "User not authenticated")
	}

	rbacService := services.NewRBACService()
	user, err := rbacService.GetUserWithRoles(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return helpers.NotFoundResponse(c, "User not found")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to fetch user profile")
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, dto.ProfileResponse{
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

func UpdateProfile(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	if userID == "" {
		return helpers.UnauthorizedResponse(c, "User not authenticated")
	}

	// Parse flexible JSON payload
	var req dto.UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return helpers.ValidationErrorResponse(c, "Invalid request body")
	}

	// Fetch the existing user
	var user models.User
	result := database.DB.Where("id = ?", userID).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return helpers.NotFoundResponse(c, "User not found")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to fetch user")
	}

	// Build updates map for selective updates
	updates := make(map[string]interface{})
	
	// Process each field in the request
	for key, value := range req {
		switch key {
		case "phone":
			if v, ok := value.(string); ok {
				if v == "" {
					updates["phone"] = nil
				} else {
					if !phonenumbers.IsValidNumber(v, phonenumbers.DefaultPhoneRegion) {
						return helpers.ValidationErrorResponse(c, "Invalid phone number format")
					}
					normalizedPhone, err := phonenumbers.NormalizeNumber(v, phonenumbers.DefaultPhoneRegion)
					if err != nil {
						return helpers.ValidationErrorResponse(c, "Invalid phone number format")
					}
					updates["phone"] = normalizedPhone
				}
			}
		case "company":
			if v, ok := value.(string); ok {
				if v == "" {
					updates["company"] = nil
				} else {
					updates["company"] = v
				}
			}
		case "name":
			if v, ok := value.(string); ok && v != "" {
				updates["name"] = v
			}
		// Skip protected fields (including roles - handled separately via admin endpoints)
		case "id", "email", "password", "roles", "created_at", "updated_at", "deleted_at":
			continue
		// For any other fields, you can add more cases as needed
		default:
			continue
		}
	}

	// Update fields
	if len(updates) > 0 {
		result = database.DB.Model(&user).Updates(updates)
		if result.Error != nil {
			return helpers.InternalServerErrorResponse(c, "Failed to update profile")
		}
	}
	
	// Reload the user with roles
	rbacService := services.NewRBACService()
	updatedUser, err := rbacService.GetUserWithRoles(userID)
	if err != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to fetch updated profile")
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, dto.ProfileResponse{
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

func ForgotPassword(c *fiber.Ctx) error {
	var req dto.ForgotPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return helpers.ValidationErrorResponse(c, "Invalid request body")
	}

	if err := validate.Struct(req); err != nil {
		return helpers.ValidationErrorResponse(c, helpers.FormatValidationError(err))
	}

	var user models.User
	result := database.DB.Where("email = ?", helpers.NormalizeEmail(req.Email)).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return helpers.SuccessResponse(c, fiber.StatusOK, dto.MessageResponse{
				Message: "If an account with that email exists, a password reset link has been sent.",
			})
		}
		return helpers.InternalServerErrorResponse(c, "Failed to process request")
	}

	token, hashedToken, err := auth.GenerateResetToken()
	if err != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to generate reset token")
	}

	resetToken := models.PasswordResetToken{
		UserID:    user.ID,
		Token:     hashedToken,
		ExpiresAt: auth.GetResetTokenExpiration(),
	}

	result = database.DB.Create(&resetToken)
	if result.Error != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to create reset token")
	}

	emailService := services.NewEmailService()
	if err := emailService.SendPasswordReset(user.Email, token); err != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to send reset email")
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, dto.MessageResponse{
		Message: "If an account with that email exists, a password reset link has been sent.",
	})
}

func ResetPassword(c *fiber.Ctx) error {
	var req dto.ResetPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return helpers.ValidationErrorResponse(c, "Invalid request body")
	}

	if err := validate.Struct(req); err != nil {
		return helpers.ValidationErrorResponse(c, helpers.FormatValidationError(err))
	}

	hashedToken := auth.HashToken(req.Token)

	var resetToken models.PasswordResetToken
	result := database.DB.Where("token = ?", hashedToken).First(&resetToken)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return helpers.UnauthorizedResponse(c, "Invalid or expired reset token")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to process request")
	}

	if resetToken.IsExpired() {
		database.DB.Delete(&resetToken)
		return helpers.UnauthorizedResponse(c, "Invalid or expired reset token")
	}

	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to process password")
	}

	result = database.DB.Model(&models.User{}).Where("id = ?", resetToken.UserID).Update("password", hashedPassword)
	if result.Error != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to update password")
	}

	database.DB.Where("user_id = ?", resetToken.UserID).Delete(&models.PasswordResetToken{})

	return helpers.SuccessResponse(c, fiber.StatusOK, dto.MessageResponse{
		Message: "Password has been reset successfully.",
	})
}