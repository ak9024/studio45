package dto

type RegisterRequest struct {
	Email    string  `json:"email" validate:"required,email"`
	Password string  `json:"password" validate:"required,min=6"`
	Name     string  `json:"name" validate:"required,min=2"`
	Phone    *string `json:"phone,omitempty" validate:"omitempty,phone"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type AuthResponse struct {
	Token string      `json:"token"`
	User  UserResponse `json:"user"`
}

type UserResponse struct {
	ID    string   `json:"id"`
	Email string   `json:"email"`
	Name  string   `json:"name"`
	Roles []string `json:"roles"`
}

type UpdateProfileRequest map[string]interface{}

type ProfileResponse struct {
	ID        string   `json:"id"`
	Email     string   `json:"email"`
	Name      string   `json:"name"`
	Phone     *string  `json:"phone"`
	Company   *string  `json:"company"`
	Roles     []string `json:"roles"`
	CreatedAt string   `json:"created_at"`
	UpdatedAt string   `json:"updated_at"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type ResetPasswordRequest struct {
	Token    string `json:"token" validate:"required"`
	Password string `json:"password" validate:"required,min=6"`
}

type MessageResponse struct {
	Message string `json:"message"`
}

type UserManagementResponse struct {
	ID        string   `json:"id"`
	Email     string   `json:"email"`
	Name      string   `json:"name"`
	Phone     *string  `json:"phone"`
	Company   *string  `json:"company"`
	Roles     []string `json:"roles"`
	CreatedAt string   `json:"created_at"`
	UpdatedAt string   `json:"updated_at"`
}

type UpdateRolesRequest struct {
	Roles []string `json:"roles" validate:"required,min=1"`
}

type UpdateUserRequest struct {
	Email   *string `json:"email,omitempty" validate:"omitempty,email"`
	Name    *string `json:"name,omitempty" validate:"omitempty,min=2"`
	Phone   *string `json:"phone,omitempty" validate:"omitempty,phone"`
	Company *string `json:"company,omitempty"`
}

type AdminRegisterUserRequest struct {
	Email    string   `json:"email" validate:"required,email"`
	Password string   `json:"password" validate:"required,min=6"`
	Name     string   `json:"name" validate:"required,min=2"`
	Phone    *string  `json:"phone,omitempty" validate:"omitempty,phone"`
	Company  *string  `json:"company,omitempty"`
	Roles    []string `json:"roles,omitempty" validate:"omitempty,min=1"`
}

type PaginationRequest struct {
	Page     int    `json:"page" form:"page" validate:"omitempty,min=1"`
	Limit    int    `json:"limit" form:"limit" validate:"omitempty,min=1,max=100"`
	Search   string `json:"search" form:"search"`
	SortBy   string `json:"sort_by" form:"sort_by"`
	SortDesc bool   `json:"sort_desc" form:"sort_desc"`
}

type PaginatedUsersResponse struct {
	Users      []UserManagementResponse `json:"users"`
	Total      int64                    `json:"total"`
	Page       int                      `json:"page"`
	Limit      int                      `json:"limit"`
	TotalPages int                      `json:"total_pages"`
}