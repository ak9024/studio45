package services

import (
	"api/internal/database"
	"api/internal/models"
	"errors"

	"gorm.io/gorm"
)

type RBACService struct {
	db *gorm.DB
}

func NewRBACService() *RBACService {
	return &RBACService{
		db: database.DB,
	}
}

// GetUserWithRoles fetches a user with their roles loaded
func (s *RBACService) GetUserWithRoles(userID string) (*models.User, error) {
	var user models.User
	err := s.db.Preload("Roles").Where("id = ?", userID).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserRoles returns role names for a user
func (s *RBACService) GetUserRoles(userID string) ([]string, error) {
	var roles []models.Role
	err := s.db.Table("roles").
		Select("roles.name").
		Joins("JOIN user_roles ON roles.id = user_roles.role_id").
		Where("user_roles.user_id = ?", userID).
		Find(&roles).Error
	
	if err != nil {
		return nil, err
	}

	roleNames := make([]string, len(roles))
	for i, role := range roles {
		roleNames[i] = role.Name
	}
	
	return roleNames, nil
}

// AssignRoleToUser assigns a role to a user
func (s *RBACService) AssignRoleToUser(userID, roleName string, grantedBy *string) error {
	// Check if role exists
	var role models.Role
	if err := s.db.Where("name = ?", roleName).First(&role).Error; err != nil {
		return errors.New("role not found")
	}

	// Check if user exists
	var user models.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return errors.New("user not found")
	}

	// Check if assignment already exists
	var existingAssignment models.UserRole
	err := s.db.Where("user_id = ? AND role_id = ?", userID, role.ID).First(&existingAssignment).Error
	if err == nil {
		return errors.New("user already has this role")
	}

	// Create new assignment
	userRole := models.UserRole{
		UserID:    userID,
		RoleID:    role.ID,
		GrantedBy: grantedBy,
	}

	return s.db.Create(&userRole).Error
}

// RemoveRoleFromUser removes a role from a user
func (s *RBACService) RemoveRoleFromUser(userID, roleName string) error {
	// Get role ID
	var role models.Role
	if err := s.db.Where("name = ?", roleName).First(&role).Error; err != nil {
		return errors.New("role not found")
	}

	// Delete the assignment
	result := s.db.Where("user_id = ? AND role_id = ?", userID, role.ID).Delete(&models.UserRole{})
	if result.Error != nil {
		return result.Error
	}
	
	if result.RowsAffected == 0 {
		return errors.New("user does not have this role")
	}

	return nil
}

// SetUserRoles replaces all user roles with the provided roles
func (s *RBACService) SetUserRoles(userID string, roleNames []string, grantedBy *string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		// Remove existing roles
		if err := tx.Where("user_id = ?", userID).Delete(&models.UserRole{}).Error; err != nil {
			return err
		}

		// Add new roles
		for _, roleName := range roleNames {
			var role models.Role
			if err := tx.Where("name = ?", roleName).First(&role).Error; err != nil {
				return errors.New("role not found: " + roleName)
			}

			userRole := models.UserRole{
				UserID:    userID,
				RoleID:    role.ID,
				GrantedBy: grantedBy,
			}

			if err := tx.Create(&userRole).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

// HasPermission checks if a user has a specific permission
func (s *RBACService) HasPermission(userID, permissionName string) (bool, error) {
	var count int64
	err := s.db.Table("permissions").
		Select("COUNT(*)").
		Joins("JOIN role_permissions ON permissions.id = role_permissions.permission_id").
		Joins("JOIN user_roles ON role_permissions.role_id = user_roles.role_id").
		Where("user_roles.user_id = ? AND permissions.name = ?", userID, permissionName).
		Count(&count).Error

	return count > 0, err
}

// GetUserPermissions returns all permissions for a user
func (s *RBACService) GetUserPermissions(userID string) ([]models.Permission, error) {
	var permissions []models.Permission
	err := s.db.Table("permissions").
		Select("DISTINCT permissions.*").
		Joins("JOIN role_permissions ON permissions.id = role_permissions.permission_id").
		Joins("JOIN user_roles ON role_permissions.role_id = user_roles.role_id").
		Where("user_roles.user_id = ?", userID).
		Find(&permissions).Error

	return permissions, err
}

// GetAllRoles returns all available roles
func (s *RBACService) GetAllRoles() ([]models.Role, error) {
	var roles []models.Role
	err := s.db.Find(&roles).Error
	return roles, err
}

// GetRoleByName returns a role by name
func (s *RBACService) GetRoleByName(name string) (*models.Role, error) {
	var role models.Role
	err := s.db.Where("name = ?", name).First(&role).Error
	if err != nil {
		return nil, err
	}
	return &role, nil
}

// GetAllUsersWithRoles returns all users with their roles loaded
func (s *RBACService) GetAllUsersWithRoles() ([]models.User, error) {
	var users []models.User
	err := s.db.Preload("Roles").Find(&users).Error
	return users, err
}

// UpdateUser updates user information
func (s *RBACService) UpdateUser(userID string, updates map[string]interface{}) error {
	result := s.db.Model(&models.User{}).Where("id = ?", userID).Updates(updates)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("user not found")
	}
	return nil
}

// DeleteUser soft deletes a user
func (s *RBACService) DeleteUser(userID string) error {
	var user models.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return err
	}
	return s.db.Delete(&user).Error
}