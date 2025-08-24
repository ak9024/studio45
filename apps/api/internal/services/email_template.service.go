package services

import (
	"api/internal/database"
	"api/internal/models"
	"bytes"
	"fmt"
	htmltemplate "html/template"
	"strings"
	texttemplate "text/template"

	"gorm.io/gorm"
)

type EmailTemplateService struct {
	db *gorm.DB
}

func NewEmailTemplateService() *EmailTemplateService {
	return &EmailTemplateService{
		db: database.DB,
	}
}

func (s *EmailTemplateService) GetAllTemplates() ([]models.EmailTemplate, error) {
	var templates []models.EmailTemplate
	err := s.db.Where("deleted_at IS NULL").Order("name ASC").Find(&templates).Error
	return templates, err
}

func (s *EmailTemplateService) GetTemplateByID(id string) (*models.EmailTemplate, error) {
	var template models.EmailTemplate
	err := s.db.Where("id = ? AND deleted_at IS NULL", id).First(&template).Error
	if err != nil {
		return nil, err
	}
	return &template, nil
}

func (s *EmailTemplateService) GetTemplateByName(name string) (*models.EmailTemplate, error) {
	var template models.EmailTemplate
	err := s.db.Where("name = ? AND deleted_at IS NULL AND is_active = true", name).First(&template).Error
	if err != nil {
		return nil, err
	}
	return &template, nil
}

func (s *EmailTemplateService) CreateTemplate(template *models.EmailTemplate) error {
	return s.db.Create(template).Error
}

func (s *EmailTemplateService) UpdateTemplate(id string, updates map[string]interface{}) error {
	result := s.db.Model(&models.EmailTemplate{}).Where("id = ? AND deleted_at IS NULL", id).Updates(updates)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (s *EmailTemplateService) DeleteTemplate(id string) error {
	result := s.db.Where("id = ?", id).Delete(&models.EmailTemplate{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (s *EmailTemplateService) RenderTemplate(templateName string, variables map[string]string) (*RenderedTemplate, error) {
	emailTemplate, err := s.GetTemplateByName(templateName)
	if err != nil {
		return nil, fmt.Errorf("failed to get template: %w", err)
	}

	return s.RenderEmailTemplate(emailTemplate, variables)
}

func (s *EmailTemplateService) RenderEmailTemplate(emailTemplate *models.EmailTemplate, variables map[string]string) (*RenderedTemplate, error) {
	// Render subject
	renderedSubject, err := s.renderString(emailTemplate.Subject, variables)
	if err != nil {
		return nil, fmt.Errorf("failed to render subject: %w", err)
	}

	// Render HTML template
	renderedHTML, err := s.renderHTMLString(emailTemplate.HTMLTemplate, variables)
	if err != nil {
		return nil, fmt.Errorf("failed to render HTML template: %w", err)
	}

	// Render text template
	renderedText, err := s.renderString(emailTemplate.TextTemplate, variables)
	if err != nil {
		return nil, fmt.Errorf("failed to render text template: %w", err)
	}

	return &RenderedTemplate{
		Subject:     renderedSubject,
		HTMLContent: renderedHTML,
		TextContent: renderedText,
	}, nil
}

func (s *EmailTemplateService) renderString(templateStr string, variables map[string]string) (string, error) {
	tmpl, err := texttemplate.New("template").Parse(templateStr)
	if err != nil {
		return "", fmt.Errorf("failed to parse template: %w", err)
	}

	var buf bytes.Buffer
	err = tmpl.Execute(&buf, variables)
	if err != nil {
		return "", fmt.Errorf("failed to execute template: %w", err)
	}

	return buf.String(), nil
}

func (s *EmailTemplateService) renderHTMLString(templateStr string, variables map[string]string) (string, error) {
	tmpl, err := htmltemplate.New("template").Parse(templateStr)
	if err != nil {
		return "", fmt.Errorf("failed to parse HTML template: %w", err)
	}

	var buf bytes.Buffer
	err = tmpl.Execute(&buf, variables)
	if err != nil {
		return "", fmt.Errorf("failed to execute HTML template: %w", err)
	}

	return buf.String(), nil
}

func (s *EmailTemplateService) ValidateTemplate(htmlTemplate, textTemplate string, variables map[string]string) error {
	// Validate HTML template
	_, err := s.renderHTMLString(htmlTemplate, variables)
	if err != nil {
		return fmt.Errorf("invalid HTML template: %w", err)
	}

	// Validate text template
	_, err = s.renderString(textTemplate, variables)
	if err != nil {
		return fmt.Errorf("invalid text template: %w", err)
	}

	return nil
}

func (s *EmailTemplateService) GetTemplateVariables(templateName string) ([]models.TemplateVariable, error) {
	template, err := s.GetTemplateByName(templateName)
	if err != nil {
		return nil, err
	}

	return template.Variables, nil
}

func (s *EmailTemplateService) ExtractVariablesFromTemplate(templateStr string) []string {
	var variables []string
	
	// Simple regex to find {{.VariableName}} patterns
	parts := strings.Split(templateStr, "{{.")
	for _, part := range parts[1:] { // Skip first part before any variable
		end := strings.Index(part, "}}")
		if end > 0 {
			variable := strings.TrimSpace(part[:end])
			// Check if not already in list
			found := false
			for _, existing := range variables {
				if existing == variable {
					found = true
					break
				}
			}
			if !found {
				variables = append(variables, variable)
			}
		}
	}
	
	return variables
}

type RenderedTemplate struct {
	Subject     string
	HTMLContent string
	TextContent string
}