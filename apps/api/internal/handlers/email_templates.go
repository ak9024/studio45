package handlers

import (
	"api/internal/dto"
	"api/internal/helpers"
	"api/internal/models"
	"api/internal/services"
	"errors"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// ListEmailTemplates returns all email templates (admin only)
func ListEmailTemplates(c *fiber.Ctx) error {
	templateService := services.NewEmailTemplateService()
	
	templates, err := templateService.GetAllTemplates()
	if err != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to fetch email templates")
	}

	var templateResponses []dto.EmailTemplateListResponse
	for _, template := range templates {
		templateResponses = append(templateResponses, dto.EmailTemplateListResponse{
			ID:        template.ID,
			Name:      template.Name,
			Subject:   template.Subject,
			Variables: template.Variables,
			IsActive:  template.IsActive,
			CreatedAt: template.CreatedAt.Format("2006-01-02T15:04:05Z"),
			UpdatedAt: template.UpdatedAt.Format("2006-01-02T15:04:05Z"),
		})
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, fiber.Map{
		"templates": templateResponses,
		"total":     len(templateResponses),
	})
}

// GetEmailTemplate returns a specific email template (admin only)
func GetEmailTemplate(c *fiber.Ctx) error {
	templateID := c.Params("id")
	if templateID == "" {
		return helpers.ValidationErrorResponse(c, "Template ID is required")
	}

	templateService := services.NewEmailTemplateService()
	template, err := templateService.GetTemplateByID(templateID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return helpers.NotFoundResponse(c, "Email template not found")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to fetch email template")
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, dto.EmailTemplateResponse{
		ID:           template.ID,
		Name:         template.Name,
		Subject:      template.Subject,
		HTMLTemplate: template.HTMLTemplate,
		TextTemplate: template.TextTemplate,
		Variables:    template.Variables,
		IsActive:     template.IsActive,
		CreatedAt:    template.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:    template.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	})
}

// CreateEmailTemplate creates a new email template (admin only)
func CreateEmailTemplate(c *fiber.Ctx) error {
	var req dto.CreateEmailTemplateRequest
	if err := c.BodyParser(&req); err != nil {
		return helpers.ValidationErrorResponse(c, "Invalid request body")
	}

	if err := validate.Struct(req); err != nil {
		return helpers.ValidationErrorResponse(c, helpers.FormatValidationError(err))
	}

	templateService := services.NewEmailTemplateService()

	// Validate template syntax
	testVariables := make(map[string]string)
	for _, variable := range req.Variables {
		testVariables[variable.Name] = "test_value"
	}

	if err := templateService.ValidateTemplate(req.HTMLTemplate, req.TextTemplate, testVariables); err != nil {
		return helpers.ValidationErrorResponse(c, "Invalid template syntax: "+err.Error())
	}

	template := models.EmailTemplate{
		Name:         req.Name,
		Subject:      req.Subject,
		HTMLTemplate: req.HTMLTemplate,
		TextTemplate: req.TextTemplate,
		Variables:    req.Variables,
		IsActive:     true,
	}

	if req.IsActive != nil {
		template.IsActive = *req.IsActive
	}

	err := templateService.CreateTemplate(&template)
	if err != nil {
		if helpers.IsDuplicateError(err) {
			return helpers.ConflictResponse(c, "Template with this name already exists")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to create email template")
	}

	return helpers.SuccessResponse(c, fiber.StatusCreated, dto.EmailTemplateResponse{
		ID:           template.ID,
		Name:         template.Name,
		Subject:      template.Subject,
		HTMLTemplate: template.HTMLTemplate,
		TextTemplate: template.TextTemplate,
		Variables:    template.Variables,
		IsActive:     template.IsActive,
		CreatedAt:    template.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:    template.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	})
}

// UpdateEmailTemplate updates an existing email template (admin only)
func UpdateEmailTemplate(c *fiber.Ctx) error {
	templateID := c.Params("id")
	if templateID == "" {
		return helpers.ValidationErrorResponse(c, "Template ID is required")
	}

	var req dto.UpdateEmailTemplateRequest
	if err := c.BodyParser(&req); err != nil {
		return helpers.ValidationErrorResponse(c, "Invalid request body")
	}

	if err := validate.Struct(req); err != nil {
		return helpers.ValidationErrorResponse(c, helpers.FormatValidationError(err))
	}

	templateService := services.NewEmailTemplateService()

	// Check if template exists
	existingTemplate, err := templateService.GetTemplateByID(templateID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return helpers.NotFoundResponse(c, "Email template not found")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to fetch email template")
	}

	// Build updates map for selective updates
	updates := make(map[string]interface{})

	if req.Name != nil {
		updates["name"] = *req.Name
	}

	if req.Subject != nil {
		updates["subject"] = *req.Subject
	}

	if req.HTMLTemplate != nil {
		updates["html_template"] = *req.HTMLTemplate
	}

	if req.TextTemplate != nil {
		updates["text_template"] = *req.TextTemplate
	}

	if req.Variables != nil {
		updates["variables"] = req.Variables
	}

	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}

	// Validate template syntax if templates are being updated
	if req.HTMLTemplate != nil || req.TextTemplate != nil {
		htmlTemplate := existingTemplate.HTMLTemplate
		textTemplate := existingTemplate.TextTemplate
		variables := existingTemplate.Variables

		if req.HTMLTemplate != nil {
			htmlTemplate = *req.HTMLTemplate
		}
		if req.TextTemplate != nil {
			textTemplate = *req.TextTemplate
		}
		if req.Variables != nil {
			variables = req.Variables
		}

		testVariables := make(map[string]string)
		for _, variable := range variables {
			testVariables[variable.Name] = "test_value"
		}

		if err := templateService.ValidateTemplate(htmlTemplate, textTemplate, testVariables); err != nil {
			return helpers.ValidationErrorResponse(c, "Invalid template syntax: "+err.Error())
		}
	}

	// Update template if there are changes
	if len(updates) > 0 {
		err = templateService.UpdateTemplate(templateID, updates)
		if err != nil {
			if helpers.IsDuplicateError(err) && req.Name != nil {
				return helpers.ValidationErrorResponse(c, "Template with this name already exists")
			}
			return helpers.InternalServerErrorResponse(c, "Failed to update email template")
		}
	}

	// Get updated template
	updatedTemplate, err := templateService.GetTemplateByID(templateID)
	if err != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to fetch updated email template")
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, dto.EmailTemplateResponse{
		ID:           updatedTemplate.ID,
		Name:         updatedTemplate.Name,
		Subject:      updatedTemplate.Subject,
		HTMLTemplate: updatedTemplate.HTMLTemplate,
		TextTemplate: updatedTemplate.TextTemplate,
		Variables:    updatedTemplate.Variables,
		IsActive:     updatedTemplate.IsActive,
		CreatedAt:    updatedTemplate.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:    updatedTemplate.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	})
}

// DeleteEmailTemplate deletes an email template (admin only)
func DeleteEmailTemplate(c *fiber.Ctx) error {
	templateID := c.Params("id")
	if templateID == "" {
		return helpers.ValidationErrorResponse(c, "Template ID is required")
	}

	templateService := services.NewEmailTemplateService()

	// Check if template exists
	_, err := templateService.GetTemplateByID(templateID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return helpers.NotFoundResponse(c, "Email template not found")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to fetch email template")
	}

	// Soft delete the template
	err = templateService.DeleteTemplate(templateID)
	if err != nil {
		return helpers.InternalServerErrorResponse(c, "Failed to delete email template")
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, dto.MessageResponse{
		Message: "Email template deleted successfully",
	})
}

// PreviewEmailTemplate renders a template with provided variables (admin only)
func PreviewEmailTemplate(c *fiber.Ctx) error {
	templateID := c.Params("id")
	if templateID == "" {
		return helpers.ValidationErrorResponse(c, "Template ID is required")
	}

	var req dto.PreviewEmailTemplateRequest
	if err := c.BodyParser(&req); err != nil {
		return helpers.ValidationErrorResponse(c, "Invalid request body")
	}

	if err := validate.Struct(req); err != nil {
		return helpers.ValidationErrorResponse(c, helpers.FormatValidationError(err))
	}

	templateService := services.NewEmailTemplateService()

	// Get template
	template, err := templateService.GetTemplateByID(templateID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return helpers.NotFoundResponse(c, "Email template not found")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to fetch email template")
	}

	// Render template
	rendered, err := templateService.RenderEmailTemplate(template, req.Variables)
	if err != nil {
		return helpers.ValidationErrorResponse(c, "Failed to render template: "+err.Error())
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, dto.PreviewEmailTemplateResponse{
		Subject:     rendered.Subject,
		HTMLContent: rendered.HTMLContent,
		TextContent: rendered.TextContent,
	})
}

// TestEmailTemplate sends a test email using the template (admin only)
func TestEmailTemplate(c *fiber.Ctx) error {
	templateID := c.Params("id")
	if templateID == "" {
		return helpers.ValidationErrorResponse(c, "Template ID is required")
	}

	var req dto.TestEmailTemplateRequest
	if err := c.BodyParser(&req); err != nil {
		return helpers.ValidationErrorResponse(c, "Invalid request body")
	}

	if err := validate.Struct(req); err != nil {
		return helpers.ValidationErrorResponse(c, helpers.FormatValidationError(err))
	}

	templateService := services.NewEmailTemplateService()

	// Get template
	template, err := templateService.GetTemplateByID(templateID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return helpers.NotFoundResponse(c, "Email template not found")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to fetch email template")
	}

	// Render template
	rendered, err := templateService.RenderEmailTemplate(template, req.Variables)
	if err != nil {
		return helpers.ValidationErrorResponse(c, "Failed to render template: "+err.Error())
	}

	// Send test email using the email service
	emailService := services.NewEmailService()
	
	// For testing purposes, we'll create a temporary SMTP service or use console service
	// This is a simplified approach - in production, you might want to use a dedicated test email method
	if smtpService, ok := emailService.(*services.SMTPEmailService); ok {
		// If SMTP is configured, we can send a real test email
		// For now, we'll just log the rendered content and return success
		// In a full implementation, you'd create a method to send arbitrary emails
		_ = smtpService // Use the service to send test email
	}

	// For now, just return the rendered content as confirmation
	return helpers.SuccessResponse(c, fiber.StatusOK, fiber.Map{
		"message": "Test email would be sent successfully",
		"preview": dto.PreviewEmailTemplateResponse{
			Subject:     rendered.Subject,
			HTMLContent: rendered.HTMLContent,
			TextContent: rendered.TextContent,
		},
	})
}

// GetTemplateVariables returns the available variables for a template (admin only)
func GetTemplateVariables(c *fiber.Ctx) error {
	templateID := c.Params("id")
	if templateID == "" {
		return helpers.ValidationErrorResponse(c, "Template ID is required")
	}

	templateService := services.NewEmailTemplateService()

	// Get template
	template, err := templateService.GetTemplateByID(templateID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return helpers.NotFoundResponse(c, "Email template not found")
		}
		return helpers.InternalServerErrorResponse(c, "Failed to fetch email template")
	}

	return helpers.SuccessResponse(c, fiber.StatusOK, dto.TemplateVariablesResponse{
		Variables: template.Variables,
	})
}