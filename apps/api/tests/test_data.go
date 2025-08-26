package tests

import (
	"api/internal/dto"
	"github.com/google/uuid"
)

// TestUser represents a test user with credentials
type TestUser struct {
	Email    string
	Password string
	Name     string
	Phone    *string
	Company  *string
	ID       string
	Token    string
}

// GenerateTestUser creates a new test user with random data
func GenerateTestUser() TestUser {
	phone := GenerateUniquePhone()
	company := "Test Company Inc."
	
	return TestUser{
		Email:    GenerateUniqueEmail(),
		Password: "password123",
		Name:     GenerateUniqueName(),
		Phone:    &phone,
		Company:  &company,
		ID:       uuid.New().String(),
	}
}

// GenerateTestUsers creates multiple test users
func GenerateTestUsers(count int) []TestUser {
	users := make([]TestUser, count)
	for i := 0; i < count; i++ {
		users[i] = GenerateTestUser()
	}
	return users
}

// ToRegisterRequest converts TestUser to registration request
func (u TestUser) ToRegisterRequest() dto.RegisterRequest {
	return dto.RegisterRequest{
		Email:    u.Email,
		Password: u.Password,
		Name:     u.Name,
		Phone:    u.Phone,
	}
}

// ToLoginRequest converts TestUser to login request
func (u TestUser) ToLoginRequest() dto.LoginRequest {
	return dto.LoginRequest{
		Email:    u.Email,
		Password: u.Password,
	}
}

// ToAdminRegisterRequest converts TestUser to admin registration request
func (u TestUser) ToAdminRegisterRequest(roles []string) dto.AdminRegisterUserRequest {
	return dto.AdminRegisterUserRequest{
		Email:    u.Email,
		Password: u.Password,
		Name:     u.Name,
		Phone:    u.Phone,
		Company:  u.Company,
		Roles:    roles,
	}
}

// TestRole represents a test role
type TestRole struct {
	Name        string
	Description string
	Permissions []string
}

// GenerateTestRole creates a test role
func GenerateTestRole() TestRole {
	return TestRole{
		Name:        "test-role-" + uuid.New().String()[:8],
		Description: "Test role for API testing",
		Permissions: []string{"read", "write"},
	}
}

// TestPermission represents a test permission
type TestPermission struct {
	Name        string
	Description string
	Resource    string
	Action      string
}

// GenerateTestPermission creates a test permission
func GenerateTestPermission() TestPermission {
	return TestPermission{
		Name:        "test-permission-" + uuid.New().String()[:8],
		Description: "Test permission for API testing",
		Resource:    "test-resource",
		Action:      "read",
	}
}

// TestEmailTemplate represents a test email template
type TestEmailTemplate struct {
	Name        string
	Subject     string
	Body        string
	Variables   []string
	IsActive    bool
}

// GenerateTestEmailTemplate creates a test email template
func GenerateTestEmailTemplate() TestEmailTemplate {
	return TestEmailTemplate{
		Name:      "test-template-" + uuid.New().String()[:8],
		Subject:   "Test Email Subject: {{name}}",
		Body:      "Hello {{name}}, this is a test email with {{variable}}.",
		Variables: []string{"name", "variable"},
		IsActive:  true,
	}
}

// DefaultTestData contains commonly used test data
var DefaultTestData = struct {
	AdminUser TestUser
	RegularUser TestUser
	AdminRole TestRole
	UserRole TestRole
	ReadPermission TestPermission
	WritePermission TestPermission
	WelcomeTemplate TestEmailTemplate
}{
	AdminUser: TestUser{
		Email:    "admin@test.com",
		Password: "admin123",
		Name:     "Test Admin",
		Phone:    nil,
		Company:  nil,
	},
	RegularUser: TestUser{
		Email:    "user@test.com",
		Password: "user123",
		Name:     "Test User",
		Phone:    nil,
		Company:  nil,
	},
	AdminRole: TestRole{
		Name:        "admin",
		Description: "Administrator role with full access",
		Permissions: []string{"user.create", "user.read", "user.update", "user.delete", "role.manage", "permission.manage"},
	},
	UserRole: TestRole{
		Name:        "user",
		Description: "Regular user role",
		Permissions: []string{"profile.read", "profile.update"},
	},
	ReadPermission: TestPermission{
		Name:        "read",
		Description: "Read permission",
		Resource:    "all",
		Action:      "read",
	},
	WritePermission: TestPermission{
		Name:        "write",
		Description: "Write permission",
		Resource:    "all",
		Action:      "write",
	},
	WelcomeTemplate: TestEmailTemplate{
		Name:      "welcome",
		Subject:   "Welcome {{name}}!",
		Body:      "Welcome to our platform, {{name}}! Your account has been created successfully.",
		Variables: []string{"name"},
		IsActive:  true,
	},
}

// InvalidTestData contains invalid data for negative testing
var InvalidTestData = struct {
	InvalidEmail    string
	WeakPassword    string
	EmptyName       string
	InvalidPhone    string
	NonExistentUUID string
}{
	InvalidEmail:    "not-an-email",
	WeakPassword:    "123",
	EmptyName:       "",
	InvalidPhone:    "not-a-phone",
	NonExistentUUID: uuid.New().String(),
}