package api

import (
	"fmt"
	"log"

	"api/internal/database"
	"api/internal/helpers"
	"api/internal/models"
	"api/internal/services"
	"github.com/spf13/cobra"
)

var promoteCmd = &cobra.Command{
	Use:   "promote [email]",
	Short: "Promote user from user role to admin role",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		email := args[0]
		
		// Validate email format
		if email == "" {
			return fmt.Errorf("email cannot be empty")
		}

		// Initialize database connection
		log.Println("Connecting to database...")
		dbConfig := database.LoadConfig()
		if err := database.Connect(dbConfig); err != nil {
			return fmt.Errorf("failed to connect to database: %w", err)
		}
		defer database.Close()

		// Normalize email
		normalizedEmail := helpers.NormalizeEmail(email)

		// Find user by email
		var user models.User
		result := database.DB.Preload("Roles").Where("email = ?", normalizedEmail).First(&user)
		if result.Error != nil {
			return fmt.Errorf("user with email '%s' not found", email)
		}

		// Check if user already has admin role
		if user.HasRole("admin") {
			log.Printf("User %s (%s) already has admin role", user.Name, user.Email)
			return nil
		}

		// Initialize RBAC service
		rbacService := services.NewRBACService()

		// Check if admin role exists
		adminRole, err := rbacService.GetRoleByName("admin")
		if err != nil {
			return fmt.Errorf("admin role not found: %w", err)
		}

		// Assign admin role to user
		if err := rbacService.AssignRoleToUser(user.ID, adminRole.Name, nil); err != nil {
			return fmt.Errorf("failed to assign admin role: %w", err)
		}

		log.Printf("Successfully promoted user %s (%s) to admin role", user.Name, user.Email)
		return nil
	},
}