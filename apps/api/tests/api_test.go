package tests

import (
	"api/internal/dto"
	"log"
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"
)

// TestStep represents a single test step
type TestStep struct {
	Name        string
	RequestFunc func(t *testing.T, config *TestConfig, ctx *TestContext) (*http.Response, error)
	ExpectFunc  func(t *testing.T, resp *http.Response, ctx *TestContext)
}

// TestCase represents a test case with multiple steps
type TestCase struct {
	Name  string
	Steps []TestStep
}

// TestContext holds shared data between test steps
type TestContext struct {
	AdminToken    string
	UserToken     string
	AdminUser     TestUser
	RegularUser   TestUser
	CreatedUserID string
	CreatedRoleID string
}

// TestApi is the main test function that runs all test cases
func TestApi(t *testing.T) {
	SkipIfNoDatabase(t)
	
	config := SetupTestEnvironment(t)
	defer CleanupTestEnvironment(t, config)
	
	testCases := getTestCases()
	
	for _, testCase := range testCases {
		t.Run(testCase.Name, func(t *testing.T) {
			ctx := &TestContext{}
			
			log.Printf("Running test case: %s", testCase.Name)
			
			for _, step := range testCase.Steps {
				t.Run(step.Name, func(t *testing.T) {
					log.Printf("Running step: %s", step.Name)
					
					// Execute request
					resp, err := step.RequestFunc(t, config, ctx)
					require.NoError(t, err, "Request failed for step: %s", step.Name)
					
					// Validate response
					step.ExpectFunc(t, resp, ctx)
					
					// Close response body
					if resp != nil && resp.Body != nil {
						resp.Body.Close()
					}
				})
			}
		})
	}
}

// getTestCases returns all test cases
func getTestCases() []TestCase {
	return []TestCase{
		getHealthCheckTestCase(),
		getAuthenticationTestCase(),
		getProtectedRoutesTestCase(),
		getAdminUserManagementTestCase(),
	}
}

// getHealthCheckTestCase tests the health check endpoint
func getHealthCheckTestCase() TestCase {
	return TestCase{
		Name: "Health Check",
		Steps: []TestStep{
			{
				Name: "GET /health should return success",
				RequestFunc: func(t *testing.T, config *TestConfig, ctx *TestContext) (*http.Response, error) {
					return MakeRequest(t, config.App, "GET", "/health", nil, nil)
				},
				ExpectFunc: func(t *testing.T, resp *http.Response, ctx *TestContext) {
					require.Equal(t, 200, resp.StatusCode)
					
					// Debug: print response body
					body := GetResponseBody(t, resp)
					log.Printf("Health response body: %s", body)
					
					if len(body) > 0 {
						result := RequireJSONResponseFromBody(t, body)
						require.Contains(t, result, "status")
					} else {
						t.Log("Health endpoint returned empty body")
					}
				},
			},
		},
	}
}

// getAuthenticationTestCase tests authentication endpoints
func getAuthenticationTestCase() TestCase {
	return TestCase{
		Name: "Authentication Flow",
		Steps: []TestStep{
			{
				Name: "POST /api/v1/auth/register should create new user",
				RequestFunc: func(t *testing.T, config *TestConfig, ctx *TestContext) (*http.Response, error) {
					ctx.RegularUser = GenerateTestUser()
					return MakeRequest(t, config.App, "POST", "/api/v1/auth/register", ctx.RegularUser.ToRegisterRequest(), nil)
				},
				ExpectFunc: func(t *testing.T, resp *http.Response, ctx *TestContext) {
					// Debug: always print response body to see what we're getting
					body := GetResponseBody(t, resp)
					log.Printf("Registration response (status %d): %s", resp.StatusCode, body)
					
					require.Equal(t, 201, resp.StatusCode)
					
					if len(body) == 0 {
						t.Error("Registration response body is empty")
						return
					}
					
					result := RequireJSONResponseFromBody(t, body)
					
					// Check for user field
					user, exists := result["user"]
					require.True(t, exists, "Response should contain user field")
					
					userObj, ok := user.(map[string]interface{})
					require.True(t, ok, "User should be an object")
					
					require.Equal(t, ctx.RegularUser.Email, userObj["email"])
					require.Equal(t, ctx.RegularUser.Name, userObj["name"])
				},
			},
			{
				Name: "POST /api/v1/auth/register with duplicate email should fail",
				RequestFunc: func(t *testing.T, config *TestConfig, ctx *TestContext) (*http.Response, error) {
					return MakeRequest(t, config.App, "POST", "/api/v1/auth/register", ctx.RegularUser.ToRegisterRequest(), nil)
				},
				ExpectFunc: func(t *testing.T, resp *http.Response, ctx *TestContext) {
					RequireErrorResponse(t, resp, 409)
				},
			},
			{
				Name: "POST /api/v1/auth/register with invalid email should fail",
				RequestFunc: func(t *testing.T, config *TestConfig, ctx *TestContext) (*http.Response, error) {
					invalidUser := ctx.RegularUser.ToRegisterRequest()
					invalidUser.Email = InvalidTestData.InvalidEmail
					return MakeRequest(t, config.App, "POST", "/api/v1/auth/register", invalidUser, nil)
				},
				ExpectFunc: func(t *testing.T, resp *http.Response, ctx *TestContext) {
					RequireErrorResponse(t, resp, 400)
				},
			},
			{
				Name: "POST /api/v1/auth/login with valid credentials should return token",
				RequestFunc: func(t *testing.T, config *TestConfig, ctx *TestContext) (*http.Response, error) {
					return MakeRequest(t, config.App, "POST", "/api/v1/auth/login", ctx.RegularUser.ToLoginRequest(), nil)
				},
				ExpectFunc: func(t *testing.T, resp *http.Response, ctx *TestContext) {
					token := RequireAuthToken(t, resp)
					require.NotEmpty(t, token)
					ctx.UserToken = token
				},
			},
			{
				Name: "POST /api/v1/auth/login with invalid credentials should fail",
				RequestFunc: func(t *testing.T, config *TestConfig, ctx *TestContext) (*http.Response, error) {
					invalidLogin := dto.LoginRequest{
						Email:    ctx.RegularUser.Email,
						Password: "wrongpassword",
					}
					return MakeRequest(t, config.App, "POST", "/api/v1/auth/login", invalidLogin, nil)
				},
				ExpectFunc: func(t *testing.T, resp *http.Response, ctx *TestContext) {
					RequireErrorResponse(t, resp, 401)
				},
			},
			{
				Name: "POST /api/v1/auth/forgot-password with valid email should succeed",
				RequestFunc: func(t *testing.T, config *TestConfig, ctx *TestContext) (*http.Response, error) {
					forgotReq := dto.ForgotPasswordRequest{
						Email: ctx.RegularUser.Email,
					}
					return MakeRequest(t, config.App, "POST", "/api/v1/auth/forgot-password", forgotReq, nil)
				},
				ExpectFunc: func(t *testing.T, resp *http.Response, ctx *TestContext) {
					require.Equal(t, 200, resp.StatusCode)
					
					// Read response body once and validate JSON
					body := GetResponseBody(t, resp)
					log.Printf("ForgotPassword response body: %s", body)
					
					if len(body) == 0 {
						t.Error("ForgotPassword response body is empty")
						return
					}
					
					result := RequireJSONResponseFromBody(t, body)
					require.Contains(t, result, "message")
				},
			},
		},
	}
}

// getProtectedRoutesTestCase tests protected user endpoints
func getProtectedRoutesTestCase() TestCase {
	return TestCase{
		Name: "Protected Routes",
		Steps: []TestStep{
			{
				Name: "Setup: Create and login user",
				RequestFunc: func(t *testing.T, config *TestConfig, ctx *TestContext) (*http.Response, error) {
					// Create user if not exists
					if ctx.RegularUser.Email == "" {
						ctx.RegularUser = GenerateTestUser()
						_, err := MakeRequest(t, config.App, "POST", "/api/v1/auth/register", ctx.RegularUser.ToRegisterRequest(), nil)
						if err != nil {
							return nil, err
						}
					}
					
					// Login to get token
					return MakeRequest(t, config.App, "POST", "/api/v1/auth/login", ctx.RegularUser.ToLoginRequest(), nil)
				},
				ExpectFunc: func(t *testing.T, resp *http.Response, ctx *TestContext) {
					token := RequireAuthToken(t, resp)
					ctx.UserToken = token
				},
			},
			{
				Name: "GET /api/v1/protected/profile without auth should fail",
				RequestFunc: func(t *testing.T, config *TestConfig, ctx *TestContext) (*http.Response, error) {
					return MakeRequest(t, config.App, "GET", "/api/v1/protected/profile", nil, nil)
				},
				ExpectFunc: func(t *testing.T, resp *http.Response, ctx *TestContext) {
					RequireErrorResponse(t, resp, 401)
				},
			},
			{
				Name: "GET /api/v1/protected/profile with auth should return user profile",
				RequestFunc: func(t *testing.T, config *TestConfig, ctx *TestContext) (*http.Response, error) {
					return MakeAuthenticatedRequest(t, config.App, "GET", "/api/v1/protected/profile", nil, ctx.UserToken)
				},
				ExpectFunc: func(t *testing.T, resp *http.Response, ctx *TestContext) {
					require.Equal(t, 200, resp.StatusCode)
					
					// Read response body once and validate JSON
					body := GetResponseBody(t, resp)
					log.Printf("Profile response body: %s", body)
					
					if len(body) == 0 {
						t.Error("Profile response body is empty")
						return
					}
					
					result := RequireJSONResponseFromBody(t, body)
					require.Contains(t, result, "email")
					require.Contains(t, result, "name")
					require.Equal(t, ctx.RegularUser.Email, result["email"])
				},
			},
			{
				Name: "PUT /api/v1/protected/profile should update user profile",
				RequestFunc: func(t *testing.T, config *TestConfig, ctx *TestContext) (*http.Response, error) {
					updateReq := map[string]interface{}{
						"name":    "Updated Name",
						"company": "Updated Company",
					}
					return MakeAuthenticatedRequest(t, config.App, "PUT", "/api/v1/protected/profile", updateReq, ctx.UserToken)
				},
				ExpectFunc: func(t *testing.T, resp *http.Response, ctx *TestContext) {
					require.Equal(t, 200, resp.StatusCode)
					
					// Read response body once and validate JSON
					body := GetResponseBody(t, resp)
					log.Printf("Profile update response body: %s", body)
					
					if len(body) == 0 {
						t.Error("Profile update response body is empty")
						return
					}
					
					result := RequireJSONResponseFromBody(t, body)
					require.Equal(t, "Updated Name", result["name"])
					require.Equal(t, "Updated Company", result["company"])
				},
			},
		},
	}
}

// getAdminUserManagementTestCase tests admin user management endpoints
func getAdminUserManagementTestCase() TestCase {
	return TestCase{
		Name: "Admin User Management",
		Steps: []TestStep{
			{
				Name: "Setup: Create admin user",
				RequestFunc: func(t *testing.T, config *TestConfig, ctx *TestContext) (*http.Response, error) {
					adminUser, token := CreateAdminUser(t, config)
					ctx.AdminUser = adminUser
					ctx.AdminToken = token
					
					// Return a mock response since we're just setting up
					return &http.Response{StatusCode: 200}, nil
				},
				ExpectFunc: func(t *testing.T, resp *http.Response, ctx *TestContext) {
					require.Equal(t, 200, resp.StatusCode)
				},
			},
			{
				Name: "GET /api/v1/admin/users should return user list",
				RequestFunc: func(t *testing.T, config *TestConfig, ctx *TestContext) (*http.Response, error) {
					return MakeAuthenticatedRequest(t, config.App, "GET", "/api/v1/admin/users", nil, ctx.AdminToken)
				},
				ExpectFunc: func(t *testing.T, resp *http.Response, ctx *TestContext) {
					require.Equal(t, 200, resp.StatusCode)
					
					// Read response body once and validate JSON
					body := GetResponseBody(t, resp)
					log.Printf("Admin user list response body: %s", body)
					
					if len(body) == 0 {
						t.Error("Admin user list response body is empty")
						return
					}
					
					result := RequireJSONResponseFromBody(t, body)
					require.Contains(t, result, "users")
					require.Contains(t, result, "total")
				},
			},
			{
				Name: "POST /api/v1/admin/users should create new user",
				RequestFunc: func(t *testing.T, config *TestConfig, ctx *TestContext) (*http.Response, error) {
					newUser := GenerateTestUser().ToAdminRegisterRequest([]string{"user"})
					return MakeAuthenticatedRequest(t, config.App, "POST", "/api/v1/admin/users", newUser, ctx.AdminToken)
				},
				ExpectFunc: func(t *testing.T, resp *http.Response, ctx *TestContext) {
					require.Equal(t, 201, resp.StatusCode)
					
					// Read response body once and validate JSON
					body := GetResponseBody(t, resp)
					log.Printf("Admin user creation response body: %s", body)
					
					if len(body) == 0 {
						t.Error("Admin user creation response body is empty")
						return
					}
					
					result := RequireJSONResponseFromBody(t, body)
					user, exists := result["user"]
					require.True(t, exists, "Response should contain user field")
					
					userObj, ok := user.(map[string]interface{})
					require.True(t, ok, "User should be an object")
					RequireIsUUID(t, userObj["id"].(string))
					ctx.CreatedUserID = userObj["id"].(string)
				},
			},
		},
	}
}