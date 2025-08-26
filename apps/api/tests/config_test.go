package tests

import (
	"api/internal/database"
	"api/internal/server"
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

// TestConfig holds test configuration
type TestConfig struct {
	App *fiber.App
	DB  *gorm.DB
}

// SetupTestEnvironment initializes test environment
func SetupTestEnvironment(t *testing.T) *TestConfig {
	// Set test environment variables
	setTestEnvVars()
	
	// Initialize database connection
	err := database.Connect()
	require.NoError(t, err, "Failed to connect to test database")
	
	// Get the database instance
	db := database.DB
	require.NotNil(t, db, "Database instance is nil")
	
	// Auto-migrate models - simplified for testing
	// Note: In real implementation, you might want to run actual migrations
	// For now, we'll rely on the application's auto-migration
	
	// Set up default roles and permissions for testing
	setupDefaultRolesAndPermissions(db)
	
	// Create Fiber app
	app := server.NewRouter()
	
	return &TestConfig{
		App: app,
		DB:  db,
	}
}

// CleanupTestEnvironment cleans up test environment
func CleanupTestEnvironment(t *testing.T, config *TestConfig) {
	if config.DB != nil {
		// Clean up test data
		cleanupTestData(t, config.DB)
		
		// Close database connection
		sqlDB, err := config.DB.DB()
		if err == nil {
			sqlDB.Close()
		}
	}
}

// setTestEnvVars sets environment variables for testing
func setTestEnvVars() {
	envVars := map[string]string{
		"DB_HOST":             getEnvWithDefault("TEST_DB_HOST", "localhost"),
		"DB_PORT":             getEnvWithDefault("TEST_DB_PORT", "5432"),
		"DB_USER":             getEnvWithDefault("TEST_DB_USER", "postgres"),
		"DB_PASSWORD":         getEnvWithDefault("TEST_DB_PASSWORD", "postgres"),
		"DB_NAME":             getEnvWithDefault("TEST_DB_NAME", "studio45_test"),
		"JWT_SECRET":          getEnvWithDefault("TEST_JWT_SECRET", "test-secret-key-for-testing-only"),
		"BCRYPT_COST":         getEnvWithDefault("TEST_BCRYPT_COST", "4"), // Lower cost for faster tests
		"CORS_ALLOWED_ORIGINS": "*",
		"LOG_LEVEL":           "error", // Reduce log noise during tests
	}
	
	for key, value := range envVars {
		os.Setenv(key, value)
	}
}

// getEnvWithDefault gets environment variable with default value
func getEnvWithDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// cleanupTestData removes test data from database
func cleanupTestData(t *testing.T, db *gorm.DB) {
	// Order matters due to foreign key constraints
	tables := []string{
		"user_roles",
		"role_permissions", 
		"password_reset_tokens",
		"email_templates",
		"users",
		"roles",
		"permissions",
	}
	
	for _, table := range tables {
		result := db.Exec(fmt.Sprintf("DELETE FROM %s WHERE 1=1", table))
		if result.Error != nil {
			log.Printf("Warning: Failed to cleanup table %s: %v", table, result.Error)
		}
	}
}

// MakeRequest makes HTTP request to the test server
func MakeRequest(t *testing.T, app *fiber.App, method, path string, body interface{}, headers map[string]string) (*http.Response, error) {
	var bodyReader *bytes.Reader
	
	if body != nil {
		jsonBody, err := json.Marshal(body)
		require.NoError(t, err)
		bodyReader = bytes.NewReader(jsonBody)
	} else {
		bodyReader = bytes.NewReader([]byte{})
	}
	
	req, err := http.NewRequest(method, path, bodyReader)
	require.NoError(t, err)
	
	// Set default content type
	req.Header.Set("Content-Type", "application/json")
	
	// Set custom headers
	for key, value := range headers {
		req.Header.Set(key, value)
	}
	
	// Use Fiber's Test method
	resp, err := app.Test(req, -1) // -1 means no timeout
	return resp, err
}

// MakeAuthenticatedRequest makes authenticated HTTP request
func MakeAuthenticatedRequest(t *testing.T, app *fiber.App, method, path string, body interface{}, token string) (*http.Response, error) {
	headers := map[string]string{
		"Authorization": "Bearer " + token,
	}
	return MakeRequest(t, app, method, path, body, headers)
}

// CreateTestUser creates a test user in the database and returns auth token
func CreateTestUser(t *testing.T, app *fiber.App, user TestUser, roles ...string) string {
	// Register user
	registerReq := user.ToRegisterRequest()
	resp, err := MakeRequest(t, app, "POST", "/api/v1/auth/register", registerReq, nil)
	require.NoError(t, err)
	require.Equal(t, 201, resp.StatusCode)
	
	// Login to get token
	loginReq := user.ToLoginRequest()
	resp, err = MakeRequest(t, app, "POST", "/api/v1/auth/login", loginReq, nil)
	require.NoError(t, err)
	
	token := RequireAuthToken(t, resp)
	
	// If roles specified and we have admin access, assign roles
	if len(roles) > 0 {
		// This would require admin token - implement if needed
		log.Printf("Role assignment not implemented in CreateTestUser")
	}
	
	return token
}

// CreateAdminUser creates an admin user for testing
func CreateAdminUser(t *testing.T, config *TestConfig) (TestUser, string) {
	adminUser := GenerateTestUser()
	
	// Register user first
	registerReq := adminUser.ToRegisterRequest()
	resp, err := MakeRequest(t, config.App, "POST", "/api/v1/auth/register", registerReq, nil)
	require.NoError(t, err)
	require.Equal(t, 201, resp.StatusCode)
	
	// Manually assign admin role in database
	// Find the user
	var user struct {
		ID string `json:"id"`
	}
	err = config.DB.Raw("SELECT id FROM users WHERE email = ?", adminUser.Email).Scan(&user).Error
	require.NoError(t, err)
	
	// Create admin role if it doesn't exist
	config.DB.Exec(`
		INSERT INTO roles (id, name, description) 
		VALUES (gen_random_uuid(), 'admin', 'Administrator role') 
		ON CONFLICT (name) DO NOTHING
	`)
	
	// Assign admin role to user
	config.DB.Exec(`
		INSERT INTO user_roles (user_id, role_id) 
		SELECT ?, r.id FROM roles r WHERE r.name = 'admin'
		ON CONFLICT DO NOTHING
	`, user.ID)
	
	// Login to get token
	loginReq := adminUser.ToLoginRequest()
	resp, err = MakeRequest(t, config.App, "POST", "/api/v1/auth/login", loginReq, nil)
	require.NoError(t, err)
	
	token := RequireAuthToken(t, resp)
	adminUser.Token = token
	adminUser.ID = user.ID
	
	return adminUser, token
}

// setupDefaultRolesAndPermissions creates basic roles and permissions for testing
func setupDefaultRolesAndPermissions(db *gorm.DB) {
	// Create basic roles
	db.Exec(`
		INSERT INTO roles (id, name, description, created_at, updated_at) 
		VALUES 
			(gen_random_uuid(), 'admin', 'Administrator role with full access', NOW(), NOW()),
			(gen_random_uuid(), 'user', 'Regular user role', NOW(), NOW())
		ON CONFLICT (name) DO NOTHING
	`)
	
	// Create basic permissions
	db.Exec(`
		INSERT INTO permissions (id, name, description, resource, action, created_at, updated_at)
		VALUES 
			(gen_random_uuid(), 'user.read', 'Read user data', 'user', 'read', NOW(), NOW()),
			(gen_random_uuid(), 'user.write', 'Write user data', 'user', 'write', NOW(), NOW()),
			(gen_random_uuid(), 'admin.access', 'Access admin panel', 'admin', 'access', NOW(), NOW())
		ON CONFLICT (name) DO NOTHING
	`)
	
	// Assign permissions to admin role
	db.Exec(`
		INSERT INTO role_permissions (role_id, permission_id)
		SELECT r.id, p.id 
		FROM roles r, permissions p 
		WHERE r.name = 'admin'
		ON CONFLICT DO NOTHING
	`)
	
	// Assign basic permissions to user role
	db.Exec(`
		INSERT INTO role_permissions (role_id, permission_id)
		SELECT r.id, p.id 
		FROM roles r, permissions p 
		WHERE r.name = 'user' AND p.name IN ('user.read', 'user.write')
		ON CONFLICT DO NOTHING
	`)
}

// SkipIfNoDatabase skips test if database is not available
func SkipIfNoDatabase(t *testing.T) {
	if os.Getenv("SKIP_DB_TESTS") == "true" {
		t.Skip("Skipping database test")
	}
}