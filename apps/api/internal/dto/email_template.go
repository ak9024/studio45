package dto

import "api/internal/models"

type CreateEmailTemplateRequest struct {
	Name         string                      `json:"name" validate:"required,min=1,max=100"`
	Subject      string                      `json:"subject" validate:"required,max=500"`
	HTMLTemplate string                      `json:"html_template" validate:"required"`
	TextTemplate string                      `json:"text_template" validate:"required"`
	Variables    models.TemplateVariables    `json:"variables"`
	IsActive     *bool                       `json:"is_active,omitempty"`
}

type UpdateEmailTemplateRequest struct {
	Name         *string                     `json:"name,omitempty" validate:"omitempty,min=1,max=100"`
	Subject      *string                     `json:"subject,omitempty" validate:"omitempty,max=500"`
	HTMLTemplate *string                     `json:"html_template,omitempty"`
	TextTemplate *string                     `json:"text_template,omitempty"`
	Variables    models.TemplateVariables    `json:"variables,omitempty"`
	IsActive     *bool                       `json:"is_active,omitempty"`
}

type EmailTemplateResponse struct {
	ID           string                      `json:"id"`
	Name         string                      `json:"name"`
	Subject      string                      `json:"subject"`
	HTMLTemplate string                      `json:"html_template"`
	TextTemplate string                      `json:"text_template"`
	Variables    models.TemplateVariables    `json:"variables"`
	IsActive     bool                        `json:"is_active"`
	CreatedAt    string                      `json:"created_at"`
	UpdatedAt    string                      `json:"updated_at"`
}

type EmailTemplateListResponse struct {
	ID        string                      `json:"id"`
	Name      string                      `json:"name"`
	Subject   string                      `json:"subject"`
	Variables models.TemplateVariables    `json:"variables"`
	IsActive  bool                        `json:"is_active"`
	CreatedAt string                      `json:"created_at"`
	UpdatedAt string                      `json:"updated_at"`
}

type PreviewEmailTemplateRequest struct {
	Variables map[string]string `json:"variables" validate:"required"`
}

type PreviewEmailTemplateResponse struct {
	Subject      string `json:"subject"`
	HTMLContent  string `json:"html_content"`
	TextContent  string `json:"text_content"`
}

type TestEmailTemplateRequest struct {
	Email     string            `json:"email" validate:"required,email"`
	Variables map[string]string `json:"variables" validate:"required"`
}

type TemplateVariablesResponse struct {
	Variables []models.TemplateVariable `json:"variables"`
}