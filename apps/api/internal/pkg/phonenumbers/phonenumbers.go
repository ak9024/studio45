package phonenumbers

import (
	"errors"
	"fmt"

	"github.com/nyaruka/phonenumbers"
)

const DefaultPhoneRegion = "ID"

var (
	ErrInvalidPhoneNumber = errors.New("invalid phone number")
	ErrMissingCountryCode = errors.New("missing country code")
)

type PhoneNumber struct {
	Number     string
	Region     string
	IsValid    bool
	E164Format string
}

func ParseAndValidate(number, defaultRegion string) (*PhoneNumber, error) {
	if number == "" {
		return nil, ErrInvalidPhoneNumber
	}

	if defaultRegion == "" {
		defaultRegion = DefaultPhoneRegion
	}

	num, err := phonenumbers.Parse(number, defaultRegion)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidPhoneNumber, err)
	}

	isValid := phonenumbers.IsValidNumber(num)
	if !isValid {
		return nil, ErrInvalidPhoneNumber
	}

	region := phonenumbers.GetRegionCodeForNumber(num)
	e164 := phonenumbers.Format(num, phonenumbers.E164)

	return &PhoneNumber{
		Number:     number,
		Region:     region,
		IsValid:    isValid,
		E164Format: e164,
	}, nil
}

func FormatPhone(number, region string, format phonenumbers.PhoneNumberFormat) (string, error) {
	num, err := phonenumbers.Parse(number, region)
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrInvalidPhoneNumber, err)
	}

	if !phonenumbers.IsValidNumber(num) {
		return "", ErrInvalidPhoneNumber
	}

	return phonenumbers.Format(num, format), nil
}

func FormatE164(number, region string) (string, error) {
	return FormatPhone(number, region, phonenumbers.E164)
}

func FormatNational(number, region string) (string, error) {
	return FormatPhone(number, region, phonenumbers.NATIONAL)
}

func FormatInternational(number, region string) (string, error) {
	return FormatPhone(number, region, phonenumbers.INTERNATIONAL)
}

func GetRegion(number, defaultRegion string) (string, error) {
	if defaultRegion == "" {
		defaultRegion = DefaultPhoneRegion
	}

	num, err := phonenumbers.Parse(number, defaultRegion)
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrInvalidPhoneNumber, err)
	}

	return phonenumbers.GetRegionCodeForNumber(num), nil
}

func IsValidNumber(number, region string) bool {
	if region == "" {
		region = DefaultPhoneRegion
	}

	num, err := phonenumbers.Parse(number, region)
	if err != nil {
		return false
	}

	return phonenumbers.IsValidNumber(num)
}

func NormalizeNumber(number, region string) (string, error) {
	if region == "" {
		region = DefaultPhoneRegion
	}

	return FormatE164(number, region)
}

func ValidateAndNormalize(number, region string) (string, error) {
	phoneData, err := ParseAndValidate(number, region)
	if err != nil {
		return "", err
	}

	return phoneData.E164Format, nil
}