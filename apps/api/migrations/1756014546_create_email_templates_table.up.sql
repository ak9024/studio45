-- Migration: create_email_templates_table
-- Created at: 2025-08-24T12:49:06+07:00

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create email_templates table
CREATE TABLE email_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(500) NOT NULL,
    html_template TEXT NOT NULL,
    text_template TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_email_templates_name ON email_templates (name) WHERE deleted_at IS NULL;
CREATE INDEX idx_email_templates_active ON email_templates (is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_email_templates_deleted_at ON email_templates (deleted_at);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default password reset template
INSERT INTO email_templates (name, subject, html_template, text_template, variables) VALUES 
('password_reset', 'Reset Your Password', 
'<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
        }
        .content h2 {
            color: #333333;
            margin: 0 0 20px 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content p {
            margin: 0 0 20px 0;
            font-size: 16px;
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s ease;
        }
        .button:hover {
            transform: translateY(-2px);
        }
        .security-notice {
            background: #f8f9fa;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 30px 0;
            border-radius: 4px;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            color: #666666;
            font-size: 14px;
        }
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 0;
            }
            .header, .content, .footer {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{.CompanyName}}</h1>
        </div>
        <div class="content">
            <h2>Reset Your Password</h2>
            <p>You requested a password reset for your account. Click the button below to create a new password:</p>
            
            <a href="{{.ResetURL}}" class="button">Reset Password</a>
            
            <div class="security-notice">
                <strong>⚠️ Security Notice:</strong> This link will expire in 15 minutes for your security. If you didn''t request this password reset, please ignore this email.
            </div>
            
            <p>If the button doesn''t work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">{{.ResetURL}}</p>
        </div>
        <div class="footer">
            <p>This email was sent from {{.CompanyName}}. If you have any questions, please contact our support team.</p>
        </div>
    </div>
</body>
</html>',
'{{.CompanyName}} - Password Reset

You requested a password reset for your account.

Please click or copy the following link to reset your password:
{{.ResetURL}}

SECURITY NOTICE: This link will expire in 15 minutes for your security.
If you didn''t request this password reset, please ignore this email.

If you have any questions, please contact our support team.

---
{{.CompanyName}}',
'[{"name": "CompanyName", "description": "The name of the company sending the email"}, {"name": "ResetURL", "description": "The URL for resetting the password"}]'::jsonb
);
