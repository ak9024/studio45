package handlers

import (
	"api/internal/auth"
	"api/internal/database"
	"api/internal/dto"
	"api/internal/helpers"
	"api/internal/middleware"
	"api/internal/models"
	"errors"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var validate = validator.New()

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

	result := database.DB.Create(&user)
	if result.Error != nil {
		if helpers.IsDuplicateError(result.Error) {
			return helpers.ConflictResponse(c, "Email already exists")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to create user")
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

	var user models.User
	result := database.DB.Where("id = ?", userID).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return helpers.NotFoundResponse(c, "User not found")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to fetch user profile")
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, dto.ProfileResponse{
		ID:        user.ID,
		Email:     user.Email,
		Name:      user.Name,
		CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt: user.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	})
}