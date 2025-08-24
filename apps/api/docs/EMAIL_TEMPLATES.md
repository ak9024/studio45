# Email Template Configuration System

## Table of Contents
1. [Overview](#overview)
2. [Database Architecture](#database-architecture)
3. [API Endpoints](#api-endpoints)
4. [Template Variables](#template-variables)
5. [Template Syntax](#template-syntax)
6. [Migration & Setup](#migration--setup)
7. [Integration with Email Services](#integration-with-email-services)
8. [API Usage Examples](#api-usage-examples)
9. [Security Considerations](#security-considerations)
10. [Troubleshooting](#troubleshooting)

## Overview

The Email Template Configuration System allows administrators to manage email templates through a REST API interface. Templates are stored in the database and support dynamic variable substitution using Go's template syntax.

### Key Features

- **Database-Driven**: All templates stored in PostgreSQL with full CRUD operations
- **Variable Support**: Dynamic content using documented template variables
- **Dual Format**: Both HTML and plain text versions for all templates
- **Template Validation**: Syntax validation before saving templates
- **Preview Functionality**: Test template rendering with sample data
- **Backward Compatibility**: Automatic fallback to hardcoded templates
- **Admin-Only Access**: All endpoints require admin authentication
- **Audit Trail**: Full creation and modification timestamps

### Supported Email Types

Currently supported email template types:
- `password_reset` - Password reset emails (default template included)
- Custom templates can be added for any email type

## Database Architecture

### `email_templates` Table

```sql
CREATE TABLE email_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,           -- Template identifier
    subject VARCHAR(500) NOT NULL,              -- Email subject line
    html_template TEXT NOT NULL,                -- HTML email content
    text_template TEXT NOT NULL,                -- Plain text content
    variables JSONB DEFAULT '[]'::jsonb,        -- Available variables metadata
    is_active BOOLEAN DEFAULT true,             -- Enable/disable template
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE         -- Soft delete support
);
```

### Indexes

- `idx_email_templates_name` - Fast lookup by template name
- `idx_email_templates_active` - Filter active templates
- `idx_email_templates_deleted_at` - Support soft deletes

## API Endpoints

All endpoints require admin authentication via JWT token with admin role.

### List Templates
```http
GET /api/v1/admin/email-templates
```

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "password_reset",
        "subject": "Reset Your Password",
        "variables": [
          {"name": "CompanyName", "description": "Company name"},
          {"name": "ResetURL", "description": "Password reset URL"}
        ],
        "is_active": true,
        "created_at": "2025-08-24T12:49:06Z",
        "updated_at": "2025-08-24T12:49:06Z"
      }
    ],
    "total": 1
  }
}
```

### Get Template
```http
GET /api/v1/admin/email-templates/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "password_reset",
    "subject": "Reset Your Password",
    "html_template": "<!DOCTYPE html>...",
    "text_template": "Reset your password...",
    "variables": [
      {"name": "CompanyName", "description": "Company name"},
      {"name": "ResetURL", "description": "Password reset URL"}
    ],
    "is_active": true,
    "created_at": "2025-08-24T12:49:06Z",
    "updated_at": "2025-08-24T12:49:06Z"
  }
}
```

### Create Template
```http
POST /api/v1/admin/email-templates
Content-Type: application/json
```

**Request:**
```json
{
  "name": "welcome_email",
  "subject": "Welcome to {{.CompanyName}}!",
  "html_template": "<!DOCTYPE html>\n<html>...",
  "text_template": "Welcome to {{.CompanyName}}!...",
  "variables": [
    {"name": "CompanyName", "description": "Company name"},
    {"name": "UserName", "description": "User's full name"},
    {"name": "Email", "description": "User's email address"}
  ],
  "is_active": true
}
```

**Response:** Same as Get Template

### Update Template
```http
PUT /api/v1/admin/email-templates/:id
Content-Type: application/json
```

**Request:** (All fields optional)
```json
{
  "subject": "Updated subject line",
  "html_template": "Updated HTML content...",
  "variables": [
    {"name": "NewVariable", "description": "New variable description"}
  ],
  "is_active": false
}
```

### Delete Template
```http
DELETE /api/v1/admin/email-templates/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Email template deleted successfully"
  }
}
```

### Preview Template
```http
POST /api/v1/admin/email-templates/:id/preview
Content-Type: application/json
```

**Request:**
```json
{
  "variables": {
    "CompanyName": "Studio45",
    "UserName": "John Doe",
    "Email": "john@example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subject": "Welcome to Studio45!",
    "html_content": "<!DOCTYPE html><html>...",
    "text_content": "Welcome to Studio45!..."
  }
}
```

### Test Template
```http
POST /api/v1/admin/email-templates/:id/test
Content-Type: application/json
```

**Request:**
```json
{
  "email": "test@example.com",
  "variables": {
    "CompanyName": "Studio45",
    "UserName": "Test User"
  }
}
```

### Get Template Variables
```http
GET /api/v1/admin/email-templates/:id/variables
```

**Response:**
```json
{
  "success": true,
  "data": {
    "variables": [
      {"name": "CompanyName", "description": "Company name"},
      {"name": "UserName", "description": "User's full name"}
    ]
  }
}
```

## Template Variables

### Variable Definition

Variables are documented in the `variables` JSONB field:

```json
[
  {
    "name": "CompanyName",
    "description": "The name of the company sending the email"
  },
  {
    "name": "UserName", 
    "description": "The recipient's full name"
  }
]
```

### Standard Variables

Common variables used across templates:

| Variable | Description | Example |
|----------|-------------|---------|
| `CompanyName` | Organization name | "Studio45" |
| `UserName` | User's full name | "John Doe" |
| `Email` | User's email address | "john@example.com" |
| `ResetURL` | Password reset link | "https://app.com/reset?token=..." |
| `Year` | Current year | "2025" |

## Template Syntax

Templates use Go's `text/template` and `html/template` syntax.

### Basic Variable Substitution
```html
<h1>Welcome {{.UserName}}!</h1>
<p>Your email is {{.Email}}</p>
```

### Conditional Content
```html
{{if .CompanyName}}
<p>From: {{.CompanyName}}</p>
{{end}}
```

### Escaping in HTML
HTML templates automatically escape variables for security. For trusted HTML content, use the `html` function.

### Text Templates
Plain text templates don't perform HTML escaping:
```text
Welcome {{.UserName}}!
Your reset link: {{.ResetURL}}
```

## Migration & Setup

### Database Migration

The email templates table is created via migration:

```bash
go run main.go migrate up
```

This creates the table and inserts the default `password_reset` template.

### Default Template

A default password reset template is automatically installed with:
- Professional responsive HTML design
- Plain text alternative
- Variables: `CompanyName`, `ResetURL`
- Security notice and expiration warning

### Backward Compatibility

The system maintains full backward compatibility:

1. **Email Service Integration**: Services check database first, then fall back to hardcoded templates
2. **Error Handling**: If database is unavailable, original hardcoded templates are used
3. **Gradual Migration**: Existing functionality works without any changes

## Integration with Email Services

### SMTP Email Service

The `SMTPEmailService` automatically:
1. Queries database for the requested template
2. Renders template with provided variables
3. Falls back to hardcoded template if database query fails
4. Sends both HTML and text versions

### Console Email Service  

The `ConsoleEmailService` follows the same pattern for development environments.

### Adding New Template Types

To support new email types:

1. Create template in database via API
2. Update email service to call `templateService.RenderTemplate("template_name", variables)`
3. Provide fallback hardcoded template for backward compatibility

Example:
```go
func (s *SMTPEmailService) SendWelcomeEmail(to, userName string) error {
    variables := map[string]string{
        "UserName": userName,
        "CompanyName": s.config.FromName,
    }
    
    rendered, err := templateService.RenderTemplate("welcome_email", variables)
    if err != nil {
        // Fallback to hardcoded template
        return s.sendHardcodedWelcomeEmail(to, userName)
    }
    
    // Use rendered template...
}
```

## API Usage Examples

### Complete Workflow Example

```bash
# 1. List existing templates
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8080/api/v1/admin/email-templates

# 2. Create new welcome email template  
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "welcome_email",
    "subject": "Welcome {{.UserName}}!",
    "html_template": "<h1>Welcome {{.UserName}}!</h1><p>Thanks for joining {{.CompanyName}}!</p>",
    "text_template": "Welcome {{.UserName}}!\n\nThanks for joining {{.CompanyName}}!",
    "variables": [
      {"name": "UserName", "description": "User full name"},
      {"name": "CompanyName", "description": "Company name"}
    ]
  }' \
  http://localhost:8080/api/v1/admin/email-templates

# 3. Preview template with test data
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "UserName": "John Doe",
      "CompanyName": "Studio45"
    }
  }' \
  http://localhost:8080/api/v1/admin/email-templates/TEMPLATE_ID/preview

# 4. Send test email
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "variables": {
      "UserName": "Test User",
      "CompanyName": "Studio45"
    }
  }' \
  http://localhost:8080/api/v1/admin/email-templates/TEMPLATE_ID/test
```

### JavaScript/Frontend Example

```javascript
const API_BASE = 'http://localhost:8080/api/v1/admin';
const token = localStorage.getItem('admin_token');

// Fetch all templates
async function getTemplates() {
  const response = await fetch(`${API_BASE}/email-templates`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

// Create new template
async function createTemplate(templateData) {
  const response = await fetch(`${API_BASE}/email-templates`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(templateData)
  });
  return response.json();
}

// Preview template
async function previewTemplate(templateId, variables) {
  const response = await fetch(`${API_BASE}/email-templates/${templateId}/preview`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ variables })
  });
  return response.json();
}
```

## Security Considerations

### Access Control
- All endpoints require admin authentication
- JWT tokens must contain admin role
- Template management is restricted to administrators only

### Template Security
- HTML templates use automatic escaping to prevent XSS
- Variable substitution is safe by default
- Input validation on all template fields
- Template syntax validation before saving

### Variable Validation
- Variables are validated during template rendering
- Missing variables don't break template rendering
- Type safety through Go's template system

### Audit Trail
- Full creation and modification timestamps
- Soft delete support maintains history
- Template changes are logged in application logs

## Troubleshooting

### Common Issues

#### Template Not Found
```json
{
  "success": false,
  "error": "Email template not found"
}
```
**Solution**: Check template name and ensure it exists and is active.

#### Template Syntax Error
```json
{
  "success": false,
  "error": "Invalid template syntax: template: template:1: unexpected \"}\" in operand"
}
```
**Solution**: Validate Go template syntax. Common issues:
- Unmatched `{{` and `}}`
- Invalid variable names
- Missing dots in variable references (use `{{.Variable}}` not `{{Variable}}`)

#### Variable Missing
Templates render with empty values for missing variables.
**Solution**: Ensure all required variables are provided in the variables map.

#### Permission Denied
```json
{
  "success": false,
  "error": "Forbidden"
}
```
**Solution**: Ensure the user has admin role and valid JWT token.

#### Database Connection Issues
Service falls back to hardcoded templates automatically.
**Check**: Application logs for database connection errors.

### Debug Mode

Enable debug logging to troubleshoot template issues:

```bash
LOG_LEVEL=debug go run main.go serve
```

This will log:
- Template loading attempts
- Fallback activations  
- Template rendering errors
- Variable substitution details

### Testing Templates

Use the preview endpoint extensively during development:

1. Create template with basic content
2. Test with preview endpoint using sample data
3. Iterate on template design
4. Use test endpoint to send actual emails
5. Deploy to production

### Performance Considerations

- Templates are loaded from database on each use
- Consider caching for high-volume email sending
- Database queries are optimized with indexes
- Template rendering is fast with Go's template engine

For high-volume scenarios, consider implementing template caching in the service layer.