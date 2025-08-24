package dto

import "time"

// Permission DTOs
type CreatePermissionRequest struct {
	Name        string  `json:"name" validate:"required,min=3,max=100"`
	Resource    string  `json:"resource" validate:"required,min=2,max=100"`
	Action      string  `json:"action" validate:"required,min=2,max=50"`
	Description *string `json:"description,omitempty"`
}

type UpdatePermissionRequest struct {
	Name        *string `json:"name,omitempty" validate:"omitempty,min=3,max=100"`
	Resource    *string `json:"resource,omitempty" validate:"omitempty,min=2,max=100"`
	Action      *string `json:"action,omitempty" validate:"omitempty,min=2,max=50"`
	Description *string `json:"description,omitempty"`
}

type PermissionResponse struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Resource    string    `json:"resource"`
	Action      string    `json:"action"`
	Description *string   `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Role DTOs
type CreateRoleRequest struct {
	Name        string  `json:"name" validate:"required,min=2,max=50"`
	Description *string `json:"description,omitempty"`
}

type UpdateRoleRequest struct {
	Name        *string `json:"name,omitempty" validate:"omitempty,min=2,max=50"`
	Description *string `json:"description,omitempty"`
}

type AssignPermissionsToRoleRequest struct {
	PermissionIDs []string `json:"permission_ids" validate:"required,min=1"`
}

type RoleResponse struct {
	ID          string               `json:"id"`
	Name        string               `json:"name"`
	Description *string              `json:"description"`
	Permissions []PermissionResponse `json:"permissions,omitempty"`
	CreatedAt   time.Time            `json:"created_at"`
	UpdatedAt   time.Time            `json:"updated_at"`
}