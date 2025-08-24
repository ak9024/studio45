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
		Select("DISTINCT permissions.id, permissions.name, permissions.resource, permissions.action, permissions.description, permissions.created_at, permissions.updated_at").
		Joins("JOIN role_permissions ON permissions.id = role_permissions.permission_id").
		Joins("JOIN user_roles ON role_permissions.role_id = user_roles.role_id").
		Where("user_roles.user_id = ?", userID).
		Find(&permissions).Error

	return permissions, err
}

// GetAllRoles returns all available roles
func (s *RBACService) GetAllRoles() ([]models.Role, error) {
	var roles []models.Role
	err := s.db.Select("id, name, description, created_at, updated_at").Find(&roles).Error
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
	err := s.db.Select("id, email, name, phone, company, created_at, updated_at").Preload("Roles").Find(&users).Error
	return users, err
}

// GetUsersWithRolesPaginated returns paginated users with their roles loaded
func (s *RBACService) GetUsersWithRolesPaginated(page, limit int, search, sortBy string, sortDesc bool) ([]models.User, int64, error) {
	var users []models.User
	var total int64
	
	query := s.db.Model(&models.User{})
	
	// Apply search filter if provided
	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("email ILIKE ? OR name ILIKE ? OR company ILIKE ?", searchPattern, searchPattern, searchPattern)
	}
	
	// Count total records
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	
	// Apply sorting
	orderClause := "created_at DESC" // default sorting
	if sortBy != "" {
		validSortFields := map[string]bool{
			"email":      true,
			"name":       true,
			"company":    true,
			"created_at": true,
			"updated_at": true,
		}
		if validSortFields[sortBy] {
			direction := "ASC"
			if sortDesc {
				direction = "DESC"
			}
			orderClause = sortBy + " " + direction
		}
	}
	
	// Apply pagination and get results
	offset := (page - 1) * limit
	err := query.Select("id, email, name, phone, company, created_at, updated_at").
		Preload("Roles").
		Order(orderClause).
		Offset(offset).
		Limit(limit).
		Find(&users).Error
		
	return users, total, err
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

// GetAllPermissions returns all available permissions
func (s *RBACService) GetAllPermissions() ([]models.Permission, error) {
	var permissions []models.Permission
	err := s.db.Select("id, name, resource, action, description, created_at, updated_at").Find(&permissions).Error
	return permissions, err
}

// GetPermissionByID returns a permission by its ID
func (s *RBACService) GetPermissionByID(id string) (*models.Permission, error) {
	var permission models.Permission
	err := s.db.Where("id = ?", id).First(&permission).Error
	if err != nil {
		return nil, err
	}
	return &permission, nil
}

// CreatePermission creates a new permission
func (s *RBACService) CreatePermission(name, resource, action string, description *string) (*models.Permission, error) {
	permission := models.Permission{
		Name:        name,
		Resource:    resource,
		Action:      action,
		Description: description,
	}

	err := s.db.Create(&permission).Error
	if err != nil {
		return nil, err
	}
	return &permission, nil
}

// UpdatePermission updates a permission
func (s *RBACService) UpdatePermission(id string, updates map[string]interface{}) (*models.Permission, error) {
	var permission models.Permission

	// First check if permission exists
	if err := s.db.Where("id = ?", id).First(&permission).Error; err != nil {
		return nil, err
	}

	// Update the permission
	if err := s.db.Model(&permission).Updates(updates).Error; err != nil {
		return nil, err
	}

	// Reload the updated permission
	if err := s.db.Where("id = ?", id).First(&permission).Error; err != nil {
		return nil, err
	}

	return &permission, nil
}

// DeletePermission deletes a permission (cascade to role_permissions)
func (s *RBACService) DeletePermission(id string) error {
	var permission models.Permission
	if err := s.db.Where("id = ?", id).First(&permission).Error; err != nil {
		return err
	}
	return s.db.Delete(&permission).Error
}

// GetRoleByIDWithPermissions returns a role with its permissions loaded
func (s *RBACService) GetRoleByIDWithPermissions(id string) (*models.Role, error) {
	var role models.Role
	err := s.db.Preload("Permissions").Where("id = ?", id).First(&role).Error
	if err != nil {
		return nil, err
	}
	return &role, nil
}

// CreateRole creates a new role
func (s *RBACService) CreateRole(name string, description *string) (*models.Role, error) {
	role := models.Role{
		Name:        name,
		Description: description,
	}

	err := s.db.Create(&role).Error
	if err != nil {
		return nil, err
	}
	return &role, nil
}

// UpdateRole updates a role
func (s *RBACService) UpdateRole(id string, updates map[string]interface{}) (*models.Role, error) {
	var role models.Role

	// First check if role exists
	if err := s.db.Where("id = ?", id).First(&role).Error; err != nil {
		return nil, err
	}

	// Update the role
	if err := s.db.Model(&role).Updates(updates).Error; err != nil {
		return nil, err
	}

	// Reload the updated role
	if err := s.db.Where("id = ?", id).First(&role).Error; err != nil {
		return nil, err
	}

	return &role, nil
}

// DeleteRole deletes a role (cascade to user_roles and role_permissions)
func (s *RBACService) DeleteRole(id string) error {
	var role models.Role
	if err := s.db.Where("id = ?", id).First(&role).Error; err != nil {
		return err
	}

	// Prevent deletion of critical system roles
	if role.Name == "admin" || role.Name == "user" {
		return errors.New("cannot delete system role: " + role.Name)
	}

	return s.db.Delete(&role).Error
}

// SetRolePermissions replaces all permissions for a role
func (s *RBACService) SetRolePermissions(roleID string, permissionIDs []string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		// Remove existing permissions
		if err := tx.Exec("DELETE FROM role_permissions WHERE role_id = ?", roleID).Error; err != nil {
			return err
		}

		// Add new permissions
		for _, permissionID := range permissionIDs {
			// Verify permission exists
			var permission models.Permission
			if err := tx.Where("id = ?", permissionID).First(&permission).Error; err != nil {
				return errors.New("permission not found: " + permissionID)
			}

			// Create role_permission association
			if err := tx.Exec("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)", roleID, permissionID).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

// AssignPermissionToRole assigns a single permission to a role
func (s *RBACService) AssignPermissionToRole(roleID, permissionID string) error {
	// Check if role exists
	var role models.Role
	if err := s.db.Where("id = ?", roleID).First(&role).Error; err != nil {
		return errors.New("role not found")
	}

	// Check if permission exists
	var permission models.Permission
	if err := s.db.Where("id = ?", permissionID).First(&permission).Error; err != nil {
		return errors.New("permission not found")
	}

	// Check if assignment already exists
	var count int64
	s.db.Table("role_permissions").Where("role_id = ? AND permission_id = ?", roleID, permissionID).Count(&count)
	if count > 0 {
		return errors.New("permission already assigned to role")
	}

	// Create assignment
	return s.db.Exec("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)", roleID, permissionID).Error
}

// RemovePermissionFromRole removes a permission from a role
func (s *RBACService) RemovePermissionFromRole(roleID, permissionID string) error {
	// Prevent removing critical permissions from admin role
	var role models.Role
	if err := s.db.Where("id = ?", roleID).First(&role).Error; err != nil {
		return errors.New("role not found")
	}

	if role.Name == "admin" {
		var permission models.Permission
		if err := s.db.Where("id = ?", permissionID).First(&permission).Error; err == nil {
			if permission.Name == "admin.access" {
				return errors.New("cannot remove admin.access permission from admin role")
			}
		}
	}

	result := s.db.Exec("DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?", roleID, permissionID)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return errors.New("permission not assigned to role")
	}

	return nil
}
