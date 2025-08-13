package helpers

import (
	"strings"

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
		default:
			messages = append(messages, err.Field()+" is invalid")
		}
	}
	return strings.Join(messages, ", ")
}

func IsDuplicateError(err error) bool {
	return strings.Contains(err.Error(), "duplicate key value") || strings.Contains(err.Error(), "UNIQUE constraint")
}