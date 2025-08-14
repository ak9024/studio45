package helpers

import (
	"strings"

	"api/internal/pkg/phonenumbers"
	"github.com/go-playground/validator/v10"
)

func FormatValidationError(err error) string {
	var messages []string
	for _, err := range err.(validator.ValidationErrors) {
		switch err.Tag() {
		case "required":
			messages = append(messages, err.Field()+" is required")
		case "email":
			messages = append(messages, err.Field()+" must be a valid email")
		case "min":
			messages = append(messages, err.Field()+" is too short")
		case "phone":
			messages = append(messages, err.Field()+" must be a valid phone number")
		default:
			messages = append(messages, err.Field()+" is invalid")
		}
	}
	return strings.Join(messages, ", ")
}

func IsDuplicateError(err error) bool {
	return strings.Contains(err.Error(), "duplicate key value") || strings.Contains(err.Error(), "UNIQUE constraint")
}

func ValidatePhone(fl validator.FieldLevel) bool {
	phone := fl.Field().String()
	if phone == "" {
		return true
	}
	
	return phonenumbers.IsValidNumber(phone, phonenumbers.DefaultPhoneRegion)
}

func RegisterCustomValidators(validate *validator.Validate) error {
	return validate.RegisterValidation("phone", ValidatePhone)
}