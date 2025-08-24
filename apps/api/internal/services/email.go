package services

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"gopkg.in/gomail.v2"
)

type EmailService interface {
	SendPasswordReset(to, token string) error
	SendTestEmail(to, subject, htmlContent, textContent string) error
}

type ConsoleEmailService struct{}

type SMTPConfig struct {
	Host      string
	Port      int
	Username  string
	Password  string
	FromEmail string
	FromName  string
	UseTLS    bool
}

type SMTPEmailService struct {
	config SMTPConfig
	dialer *gomail.Dialer
}

func NewEmailService() EmailService {
	emailProvider := os.Getenv("EMAIL_PROVIDER")

	switch emailProvider {
	case "smtp":
		config, err := loadSMTPConfig()
		if err != nil {
			log.Printf("Failed to load SMTP config: %v, falling back to console", err)
			return &ConsoleEmailService{}
		}

		if err := validateSMTPConfig(config); err != nil {
			log.Printf("Invalid SMTP config: %v, falling back to console", err)
			return &ConsoleEmailService{}
		}

		service, err := NewSMTPEmailService(config)
		if err != nil {
			log.Printf("Failed to create SMTP service: %v, falling back to console", err)
			return &ConsoleEmailService{}
		}

		log.Println("✅ SMTP email service initialized successfully")
		return service
	case "sendgrid":
		// Future SendGrid implementation
		log.Println("SendGrid email service not implemented yet, falling back to console")
		return &ConsoleEmailService{}
	default:
		return &ConsoleEmailService{}
	}
}

func (c *ConsoleEmailService) SendPasswordReset(to, token string) error {
	resetURL := fmt.Sprintf("%s/reset-password?token=%s",
		getBaseURL(), token)
	companyName := "Studio45" // Default company name for console service

	// Try to get template from database first
	templateService := NewEmailTemplateService()
	variables := map[string]string{
		"ResetURL":    resetURL,
		"CompanyName": companyName,
	}

	rendered, err := templateService.RenderTemplate("password_reset", variables)
	var subject, textContent string

	if err != nil {
		// Fallback to hardcoded display if database template is not available
		log.Printf("Failed to load email template from database, using fallback: %v", err)
		subject = "Reset Your Password"
		textContent = fmt.Sprintf("Click the link below to reset your password:\n%s\n\nThis link expires in 15 minutes.", resetURL)
	} else {
		subject = rendered.Subject
		textContent = rendered.TextContent
	}

	log.Printf("\n"+
		"========================================\n"+
		"PASSWORD RESET EMAIL\n"+
		"========================================\n"+
		"To: %s\n"+
		"Subject: %s\n"+
		"\n"+
		"%s\n"+
		"========================================\n",
		to, subject, textContent)

	return nil
}

func (c *ConsoleEmailService) SendTestEmail(to, subject, htmlContent, textContent string) error {
	log.Printf("\n"+
		"========================================\n"+
		"TEST EMAIL\n"+
		"========================================\n"+
		"To: %s\n"+
		"Subject: %s\n"+
		"\n"+
		"Text Content:\n"+
		"%s\n"+
		"\n"+
		"HTML Content:\n"+
		"%s\n"+
		"========================================\n",
		to, subject, textContent, htmlContent)

	return nil
}

func getBaseURL() string {
	baseURL := os.Getenv("FRONTEND_URL")
	if baseURL == "" {
		baseURL = "http://localhost:5173"
	}
	return baseURL
}

func loadSMTPConfig() (SMTPConfig, error) {
	host := os.Getenv("SMTP_HOST")
	portStr := os.Getenv("SMTP_PORT")
	username := os.Getenv("SMTP_USERNAME")
	password := os.Getenv("SMTP_PASSWORD")
	fromEmail := os.Getenv("SMTP_FROM_EMAIL")
	fromName := os.Getenv("SMTP_FROM_NAME")
	useTLSStr := os.Getenv("SMTP_USE_TLS")

	if host == "" || portStr == "" || username == "" || password == "" || fromEmail == "" {
		return SMTPConfig{}, fmt.Errorf("missing required SMTP configuration")
	}

	port, err := strconv.Atoi(portStr)
	if err != nil {
		return SMTPConfig{}, fmt.Errorf("invalid SMTP_PORT: %w", err)
	}

	useTLS := true
	if useTLSStr != "" {
		useTLS, err = strconv.ParseBool(useTLSStr)
		if err != nil {
			return SMTPConfig{}, fmt.Errorf("invalid SMTP_USE_TLS: %w", err)
		}
	}

	if fromName == "" {
		fromName = "Studio45"
	}

	return SMTPConfig{
		Host:      host,
		Port:      port,
		Username:  username,
		Password:  password,
		FromEmail: fromEmail,
		FromName:  fromName,
		UseTLS:    useTLS,
	}, nil
}

func validateSMTPConfig(config SMTPConfig) error {
	if config.Host == "" {
		return fmt.Errorf("SMTP host is required")
	}
	if config.Port <= 0 || config.Port > 65535 {
		return fmt.Errorf("SMTP port must be between 1 and 65535")
	}
	if config.Username == "" {
		return fmt.Errorf("SMTP username is required")
	}
	if config.Password == "" {
		return fmt.Errorf("SMTP password is required")
	}
	if config.FromEmail == "" {
		return fmt.Errorf("SMTP from email is required")
	}
	return nil
}

func NewSMTPEmailService(config SMTPConfig) (*SMTPEmailService, error) {
	dialer := gomail.NewDialer(config.Host, config.Port, config.Username, config.Password)

	// Test connection
	closer, err := dialer.Dial()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to SMTP server: %w", err)
	}
	closer.Close()

	return &SMTPEmailService{
		config: config,
		dialer: dialer,
	}, nil
}

func (s *SMTPEmailService) SendPasswordReset(to, token string) error {
	resetURL := fmt.Sprintf("%s/reset-password?token=%s", getBaseURL(), token)
	companyName := s.config.FromName

	// Try to get template from database first
	templateService := NewEmailTemplateService()
	variables := map[string]string{
		"ResetURL":    resetURL,
		"CompanyName": companyName,
	}

	rendered, err := templateService.RenderTemplate("password_reset", variables)
	var subject, htmlContent, textContent string

	if err != nil {
		// Fallback to hardcoded templates if database template is not available
		log.Printf("Failed to load email template from database, using fallback: %v", err)
		subject = "Reset Your Password"
		htmlContent = getPasswordResetHTMLTemplate(resetURL, companyName)
		textContent = getPasswordResetTextTemplate(resetURL, companyName)
	} else {
		subject = rendered.Subject
		htmlContent = rendered.HTMLContent
		textContent = rendered.TextContent
	}

	m := gomail.NewMessage()
	m.SetHeader("From", m.FormatAddress(s.config.FromEmail, s.config.FromName))
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)

	// Set plain text body
	m.SetBody("text/plain", textContent)

	// Set HTML body
	m.AddAlternative("text/html", htmlContent)

	// Retry logic with exponential backoff
	maxRetries := 3
	var lastErr error

	for i := 0; i < maxRetries; i++ {
		if err := s.dialer.DialAndSend(m); err != nil {
			lastErr = err
			if i < maxRetries-1 {
				waitTime := time.Duration(i+1) * time.Second
				log.Printf("Failed to send email (attempt %d/%d): %v. Retrying in %v...", i+1, maxRetries, err, waitTime)
				time.Sleep(waitTime)
				continue
			}
		} else {
			log.Printf("✅ Password reset email sent successfully to %s", to)
			return nil
		}
	}

	return fmt.Errorf("failed to send email after %d attempts: %w", maxRetries, lastErr)
}

func (s *SMTPEmailService) SendTestEmail(to, subject, htmlContent, textContent string) error {
	m := gomail.NewMessage()
	m.SetHeader("From", m.FormatAddress(s.config.FromEmail, s.config.FromName))
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)

	// Set plain text body
	m.SetBody("text/plain", textContent)

	// Set HTML body
	m.AddAlternative("text/html", htmlContent)

	// Retry logic with exponential backoff
	maxRetries := 3
	var lastErr error

	for i := 0; i < maxRetries; i++ {
		if err := s.dialer.DialAndSend(m); err != nil {
			lastErr = err
			if i < maxRetries-1 {
				waitTime := time.Duration(i+1) * time.Second
				log.Printf("Failed to send test email (attempt %d/%d): %v. Retrying in %v...", i+1, maxRetries, err, waitTime)
				time.Sleep(waitTime)
				continue
			}
		} else {
			log.Printf("✅ Test email sent successfully to %s", to)
			return nil
		}
	}

	return fmt.Errorf("failed to send test email after %d attempts: %w", maxRetries, lastErr)
}
