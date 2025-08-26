package tests

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"

	"github.com/stretchr/testify/require"
	"github.com/google/uuid"
)

// ReadJsonResult reads and unmarshals JSON response body
func ReadJsonResult(t require.TestingT, resp *http.Response, result interface{}) {
	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	
	err = json.Unmarshal(body, result)
	require.NoError(t, err)
}

// RequireIsUUID validates that a string is a valid UUID
func RequireIsUUID(t require.TestingT, value string) {
	_, err := uuid.Parse(value)
	require.NoError(t, err, "Expected valid UUID, got: %s", value)
}

// ResponseContains checks if response body contains specific text
func ResponseContains(t require.TestingT, resp *http.Response, text string) {
	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	
	bodyStr := string(body)
	require.Contains(t, bodyStr, text, "Response body does not contain expected text")
}

// GetResponseBody returns the response body as a string
func GetResponseBody(t require.TestingT, resp *http.Response) string {
	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	return string(body)
}

// RequireValidEmail checks if a string is a valid email format
func RequireValidEmail(t require.TestingT, email string) {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	require.True(t, emailRegex.MatchString(email), "Invalid email format: %s", email)
}

// RequireJSONResponse validates that response is valid JSON
func RequireJSONResponse(t require.TestingT, resp *http.Response) map[string]interface{} {
	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	
	var result map[string]interface{}
	err = json.Unmarshal(body, &result)
	require.NoError(t, err, "Response is not valid JSON: %s", string(body))
	
	return result
}

// RequireJSONResponseFromBody validates that body string is valid JSON
func RequireJSONResponseFromBody(t require.TestingT, body string) map[string]interface{} {
	var result map[string]interface{}
	err := json.Unmarshal([]byte(body), &result)
	require.NoError(t, err, "Response is not valid JSON: %s", body)
	
	return result
}

// RequireErrorResponse validates error response format
func RequireErrorResponse(t require.TestingT, resp *http.Response, expectedStatusCode int) {
	require.Equal(t, expectedStatusCode, resp.StatusCode)
	
	result := RequireJSONResponse(t, resp)
	
	// Check if error field exists
	_, hasError := result["error"]
	_, hasMessage := result["message"]
	
	require.True(t, hasError || hasMessage, "Error response should contain 'error' or 'message' field")
}

// RequireSuccessResponse validates success response format
func RequireSuccessResponse(t require.TestingT, resp *http.Response, expectedStatusCode int) {
	require.Equal(t, expectedStatusCode, resp.StatusCode)
	RequireJSONResponse(t, resp) // Ensure it's valid JSON
}

// GenerateUniqueEmail creates a unique email for testing
func GenerateUniqueEmail() string {
	return fmt.Sprintf("test-%s@example.com", uuid.New().String())
}

// GenerateUniqueName creates a unique name for testing
func GenerateUniqueName() string {
	return fmt.Sprintf("Test User %s", uuid.New().String()[:8])
}

// GenerateUniquePhone creates a unique phone number for testing
func GenerateUniquePhone() string {
	// Generate an Indonesian phone number format: +62 followed by mobile number
	// Indonesian mobile numbers typically start with 8 and have 10-12 digits after +62
	clockSeq := uuid.New().ClockSequence()
	return fmt.Sprintf("+628123%07d", clockSeq%10000000)
}

// CleanupString trims whitespace and normalizes string
func CleanupString(s string) string {
	return strings.TrimSpace(s)
}

// RequireAuthToken validates that response contains auth token
func RequireAuthToken(t require.TestingT, resp *http.Response) string {
	require.Equal(t, 200, resp.StatusCode)
	
	var result map[string]interface{}
	ReadJsonResult(t, resp, &result)
	
	token, exists := result["token"]
	require.True(t, exists, "Response should contain token field")
	
	tokenStr, ok := token.(string)
	require.True(t, ok, "Token should be a string")
	require.NotEmpty(t, tokenStr, "Token should not be empty")
	
	return tokenStr
}

// RequireUserInResponse validates user object in response
func RequireUserInResponse(t require.TestingT, resp *http.Response) map[string]interface{} {
	result := RequireJSONResponse(t, resp)
	
	user, exists := result["user"]
	require.True(t, exists, "Response should contain user field")
	
	userObj, ok := user.(map[string]interface{})
	require.True(t, ok, "User should be an object")
	
	// Validate required user fields
	id, hasID := userObj["id"]
	require.True(t, hasID, "User should have id field")
	RequireIsUUID(t, id.(string))
	
	email, hasEmail := userObj["email"]
	require.True(t, hasEmail, "User should have email field")
	RequireValidEmail(t, email.(string))
	
	name, hasName := userObj["name"]
	require.True(t, hasName, "User should have name field")
	require.NotEmpty(t, name.(string), "User name should not be empty")
	
	return userObj
}