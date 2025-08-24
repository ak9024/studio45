# SMTP Email Configuration

This document explains how to configure SMTP email sending for password reset functionality.

## Environment Variables

Add these variables to your `.env` file:

```bash
# Email Configuration
EMAIL_PROVIDER=smtp
FRONTEND_URL=http://localhost:3000

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=Studio45
SMTP_USE_TLS=true
```

## Provider-Specific Setup

### Gmail
1. Enable 2-factor authentication
2. Generate an "App Password" in your Google Account settings
3. Use the app password as `SMTP_PASSWORD`
4. Configuration:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USE_TLS=true
   ```

### Outlook/Hotmail
```
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USE_TLS=true
```

### SendGrid SMTP
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### AWS SES
```
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=your-ses-access-key-id
SMTP_PASSWORD=your-ses-secret-access-key
```

## Features

- **Fallback Support**: Automatically falls back to console logging if SMTP configuration is invalid
- **Retry Logic**: 3 automatic retries with exponential backoff
- **HTML & Text**: Sends both HTML and plain text versions
- **Security**: Connection testing on startup
- **Configurable Templates**: Database-driven email templates with API management (see [EMAIL_TEMPLATES.md](./EMAIL_TEMPLATES.md))
- **Template Fallback**: Automatic fallback to hardcoded templates if database templates are unavailable

## Testing

1. Set `EMAIL_PROVIDER=console` for development (default)
2. Set `EMAIL_PROVIDER=smtp` for production with proper SMTP credentials
3. Check server logs for successful initialization: `✅ SMTP email service initialized successfully`

## Troubleshooting

- **Invalid credentials**: Check username/password and enable app passwords
- **Connection timeout**: Verify host/port and firewall settings
- **TLS errors**: Try setting `SMTP_USE_TLS=false` for non-TLS servers
- **Authentication failed**: Ensure 2FA is enabled and using app-specific passwords

The service will automatically log detailed error messages and fall back to console mode if SMTP fails.

## Email Template Management

Email templates are now configurable through a REST API. See [EMAIL_TEMPLATES.md](./EMAIL_TEMPLATES.md) for complete documentation on:

- Managing email templates via API
- Customizing email content and styling
- Template variable system
- Preview and testing functionality
- Backward compatibility with existing templates

The email service will automatically use database templates when available and fall back to the original hardcoded templates if the database is unavailable, ensuring reliable email delivery in all scenarios.
