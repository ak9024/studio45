package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TemplateVariable struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type TemplateVariables []TemplateVariable

func (tv TemplateVariables) Value() (driver.Value, error) {
	return json.Marshal(tv)
}

func (tv *TemplateVariables) Scan(value interface{}) error {
	if value == nil {
		*tv = TemplateVariables{}
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}

	return json.Unmarshal(bytes, tv)
}

type EmailTemplate struct {
	ID           string            `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	Name         string            `gorm:"unique;not null;size:100" json:"name"`
	Subject      string            `gorm:"not null;size:500" json:"subject"`
	HTMLTemplate string            `gorm:"not null;column:html_template" json:"html_template"`
	TextTemplate string            `gorm:"not null;column:text_template" json:"text_template"`
	Variables    TemplateVariables `gorm:"type:jsonb;default:'[]'" json:"variables"`
	IsActive     bool              `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time         `json:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at"`
	DeletedAt    gorm.DeletedAt    `gorm:"index" json:"-"`
}

func (et *EmailTemplate) BeforeCreate(tx *gorm.DB) error {
	if et.ID == "" {
		et.ID = uuid.New().String()
	}
	return nil
}

func (EmailTemplate) TableName() string {
	return "email_templates"
}

func (et *EmailTemplate) GetAvailableVariables() []string {
	var names []string
	for _, variable := range et.Variables {
		names = append(names, variable.Name)
	}
	return names
}

func (et *EmailTemplate) HasVariable(name string) bool {
	for _, variable := range et.Variables {
		if variable.Name == name {
			return true
		}
	}
	return false
}