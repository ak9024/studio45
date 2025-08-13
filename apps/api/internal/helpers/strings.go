package helpers

import (
	"strings"
)

func NormalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func TrimString(s string) string {
	return strings.TrimSpace(s)
}