package models

import (
	"time"
)

type UserRole struct {
	UserID    string     `gorm:"type:uuid;primaryKey" json:"user_id"`
	RoleID    string     `gorm:"type:uuid;primaryKey" json:"role_id"`
	GrantedAt time.Time  `gorm:"default:now()" json:"granted_at"`
	GrantedBy *string    `gorm:"type:uuid" json:"granted_by"`
	ExpiresAt *time.Time `json:"expires_at"`
	
	// Relationships
	User      User `gorm:"foreignKey:UserID;references:ID" json:"user,omitempty"`
	Role      Role `gorm:"foreignKey:RoleID;references:ID" json:"role,omitempty"`
	GrantedByUser *User `gorm:"foreignKey:GrantedBy;references:ID" json:"granted_by_user,omitempty"`
}

func (UserRole) TableName() string {
	return "user_roles"
}

// IsExpired checks if the role assignment has expired
func (ur *UserRole) IsExpired() bool {
	if ur.ExpiresAt == nil {
		return false
	}
	return ur.ExpiresAt.Before(time.Now())
}