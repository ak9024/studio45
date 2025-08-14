package phonenumbers

import (
	"testing"

	"github.com/nyaruka/phonenumbers"
)

func TestParseAndValidate(t *testing.T) {
	tests := []struct {
		name          string
		number        string
		region        string
		shouldError   bool
		expectedE164  string
		expectedRegion string
	}{
		{
			name:          "Valid US number with country code",
			number:        "+1 (202) 456-1414",
			region:        "US",
			shouldError:   false,
			expectedE164:  "+12024561414",
			expectedRegion: "US",
		},
		{
			name:          "Valid US number without country code",
			number:        "(202) 456-1414",
			region:        "US",
			shouldError:   false,
			expectedE164:  "+12024561414",
			expectedRegion: "US",
		},
		{
			name:          "Valid UK number",
			number:        "+44 20 7946 0958",
			region:        "GB",
			shouldError:   false,
			expectedE164:  "+442079460958",
			expectedRegion: "GB",
		},
		{
			name:          "Valid Indonesian number with country code",
			number:        "+62 821-1234-5678",
			region:        "ID",
			shouldError:   false,
			expectedE164:  "+6282112345678",
			expectedRegion: "ID",
		},
		{
			name:          "Valid Indonesian number without country code",
			number:        "0821-1234-5678",
			region:        "ID",
			shouldError:   false,
			expectedE164:  "+6282112345678",
			expectedRegion: "ID",
		},
		{
			name:        "Invalid number",
			number:      "abc",
			region:      "US",
			shouldError: true,
		},
		{
			name:        "Empty number",
			number:      "",
			region:      "US",
			shouldError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := ParseAndValidate(tt.number, tt.region)

			if tt.shouldError {
				if err == nil {
					t.Errorf("Expected error for number %s, but got none", tt.number)
				}
				return
			}

			if err != nil {
				t.Errorf("Unexpected error for number %s: %v", tt.number, err)
				return
			}

			if result.E164Format != tt.expectedE164 {
				t.Errorf("Expected E164 format %s, got %s", tt.expectedE164, result.E164Format)
			}

			if result.Region != tt.expectedRegion {
				t.Errorf("Expected region %s, got %s", tt.expectedRegion, result.Region)
			}

			if !result.IsValid {
				t.Errorf("Expected number to be valid, but IsValid is false")
			}
		})
	}
}

func TestFormatPhone(t *testing.T) {
	tests := []struct {
		name           string
		number         string
		region         string
		format         phonenumbers.PhoneNumberFormat
		expected       string
		shouldError    bool
	}{
		{
			name:        "Format to E164",
			number:      "(202) 456-1414",
			region:      "US",
			format:      phonenumbers.E164,
			expected:    "+12024561414",
			shouldError: false,
		},
		{
			name:        "Format to National",
			number:      "(202) 456-1414",
			region:      "US",
			format:      phonenumbers.NATIONAL,
			expected:    "(202) 456-1414",
			shouldError: false,
		},
		{
			name:        "Format to International",
			number:      "(202) 456-1414",
			region:      "US",
			format:      phonenumbers.INTERNATIONAL,
			expected:    "+1 202-456-1414",
			shouldError: false,
		},
		{
			name:        "Invalid number",
			number:      "abc",
			region:      "US",
			format:      phonenumbers.E164,
			shouldError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := FormatPhone(tt.number, tt.region, tt.format)

			if tt.shouldError {
				if err == nil {
					t.Errorf("Expected error for number %s, but got none", tt.number)
				}
				return
			}

			if err != nil {
				t.Errorf("Unexpected error for number %s: %v", tt.number, err)
				return
			}

			if result != tt.expected {
				t.Errorf("Expected %s, got %s", tt.expected, result)
			}
		})
	}
}

func TestFormatE164(t *testing.T) {
	tests := []struct {
		name        string
		number      string
		region      string
		expected    string
		shouldError bool
	}{
		{
			name:        "Valid US number",
			number:      "(202) 456-1414",
			region:      "US",
			expected:    "+12024561414",
			shouldError: false,
		},
		{
			name:        "Valid UK number",
			number:      "020 7946 0958",
			region:      "GB",
			expected:    "+442079460958",
			shouldError: false,
		},
		{
			name:        "Valid Indonesian number",
			number:      "0821-1234-5678",
			region:      "ID",
			expected:    "+6282112345678",
			shouldError: false,
		},
		{
			name:        "Invalid number",
			number:      "abc",
			region:      "US",
			shouldError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := FormatE164(tt.number, tt.region)

			if tt.shouldError {
				if err == nil {
					t.Errorf("Expected error for number %s, but got none", tt.number)
				}
				return
			}

			if err != nil {
				t.Errorf("Unexpected error for number %s: %v", tt.number, err)
				return
			}

			if result != tt.expected {
				t.Errorf("Expected %s, got %s", tt.expected, result)
			}
		})
	}
}

func TestIsValidNumber(t *testing.T) {
	tests := []struct {
		name     string
		number   string
		region   string
		expected bool
	}{
		{
			name:     "Valid US number",
			number:   "(202) 456-1414",
			region:   "US",
			expected: true,
		},
		{
			name:     "Valid US number with country code",
			number:   "+1 (202) 456-1414",
			region:   "US",
			expected: true,
		},
		{
			name:     "Valid UK number",
			number:   "+44 20 7946 0958",
			region:   "GB",
			expected: true,
		},
		{
			name:     "Valid Indonesian number",
			number:   "+62 821-1234-5678",
			region:   "ID",
			expected: true,
		},
		{
			name:     "Valid Indonesian number without country code",
			number:   "0821-1234-5678",
			region:   "ID",
			expected: true,
		},
		{
			name:     "Invalid number",
			number:   "abc",
			region:   "US",
			expected: false,
		},
		{
			name:     "Empty number",
			number:   "",
			region:   "US",
			expected: false,
		},
		{
			name:     "Invalid format",
			number:   "abc-def-ghij",
			region:   "US",
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsValidNumber(tt.number, tt.region)

			if result != tt.expected {
				t.Errorf("Expected %v for number %s, got %v", tt.expected, tt.number, result)
			}
		})
	}
}

func TestNormalizeNumber(t *testing.T) {
	tests := []struct {
		name        string
		number      string
		region      string
		expected    string
		shouldError bool
	}{
		{
			name:        "US number with formatting",
			number:      "(202) 456-1414",
			region:      "US",
			expected:    "+12024561414",
			shouldError: false,
		},
		{
			name:        "US number with spaces",
			number:      "202 456 1414",
			region:      "US",
			expected:    "+12024561414",
			shouldError: false,
		},
		{
			name:        "UK number",
			number:      "020 7946 0958",
			region:      "GB",
			expected:    "+442079460958",
			shouldError: false,
		},
		{
			name:        "Invalid number",
			number:      "abc",
			region:      "US",
			shouldError: true,
		},
		{
			name:        "Default region when empty",
			number:      "0821-1234-5678",
			region:      "",
			expected:    "+6282112345678",
			shouldError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := NormalizeNumber(tt.number, tt.region)

			if tt.shouldError {
				if err == nil {
					t.Errorf("Expected error for number %s, but got none", tt.number)
				}
				return
			}

			if err != nil {
				t.Errorf("Unexpected error for number %s: %v", tt.number, err)
				return
			}

			if result != tt.expected {
				t.Errorf("Expected %s, got %s", tt.expected, result)
			}
		})
	}
}

func TestValidateAndNormalize(t *testing.T) {
	tests := []struct {
		name        string
		number      string
		region      string
		expected    string
		shouldError bool
	}{
		{
			name:        "Valid US number",
			number:      "(202) 456-1414",
			region:      "US",
			expected:    "+12024561414",
			shouldError: false,
		},
		{
			name:        "Valid number with country code",
			number:      "+1 (202) 456-1414",
			region:      "US",
			expected:    "+12024561414",
			shouldError: false,
		},
		{
			name:        "Invalid number",
			number:      "abc",
			region:      "US",
			shouldError: true,
		},
		{
			name:        "Empty number",
			number:      "",
			region:      "US",
			shouldError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := ValidateAndNormalize(tt.number, tt.region)

			if tt.shouldError {
				if err == nil {
					t.Errorf("Expected error for number %s, but got none", tt.number)
				}
				return
			}

			if err != nil {
				t.Errorf("Unexpected error for number %s: %v", tt.number, err)
				return
			}

			if result != tt.expected {
				t.Errorf("Expected %s, got %s", tt.expected, result)
			}
		})
	}
}

func TestGetRegion(t *testing.T) {
	tests := []struct {
		name        string
		number      string
		region      string
		expected    string
		shouldError bool
	}{
		{
			name:        "US number",
			number:      "+1 (202) 456-1414",
			region:      "US",
			expected:    "US",
			shouldError: false,
		},
		{
			name:        "UK number",
			number:      "+44 20 7946 0958",
			region:      "GB",
			expected:    "GB",
			shouldError: false,
		},
		{
			name:        "Indonesian number",
			number:      "+62 821-1234-5678",
			region:      "ID",
			expected:    "ID",
			shouldError: false,
		},
		{
			name:        "Invalid number",
			number:      "abc",
			region:      "US",
			shouldError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := GetRegion(tt.number, tt.region)

			if tt.shouldError {
				if err == nil {
					t.Errorf("Expected error for number %s, but got none", tt.number)
				}
				return
			}

			if err != nil {
				t.Errorf("Unexpected error for number %s: %v", tt.number, err)
				return
			}

			if result != tt.expected {
				t.Errorf("Expected %s, got %s", tt.expected, result)
			}
		})
	}
}