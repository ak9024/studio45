-- Initial schema migration for Studio45 API
-- This migration creates the complete database schema from scratch
-- Created: 2025-08-25

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create shared trigger function for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for users table
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- Create trigger for users updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create password reset tokens table
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for password reset tokens
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Create roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create role_permissions mapping table
CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- Create user_roles mapping table
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, role_id)
);

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

-- Create indexes for RBAC tables
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);

-- Create indexes for email_templates table
CREATE INDEX idx_email_templates_name ON email_templates(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_email_templates_active ON email_templates(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_email_templates_deleted_at ON email_templates(deleted_at);

-- Create triggers for updated_at columns
CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at 
    BEFORE UPDATE ON permissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at 
    BEFORE UPDATE ON email_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed default roles
INSERT INTO roles (name, description) VALUES
    ('user', 'Basic user access - can view and edit own profile'),
    ('admin', 'Full administrative access - can manage all users and system settings'),
    ('moderator', 'Content moderation access - can moderate user content'),
    ('premium', 'Premium features access - can access premium functionality');

-- Seed default permissions
INSERT INTO permissions (name, resource, action, description) VALUES
    -- User permissions
    ('profile.read', 'profile', 'read', 'View own profile'),
    ('profile.write', 'profile', 'write', 'Edit own profile'),
    
    -- User management permissions
    ('users.read', 'users', 'read', 'View user profiles'),
    ('users.write', 'users', 'write', 'Edit user profiles'),
    ('users.delete', 'users', 'delete', 'Delete users'),
    ('users.roles.manage', 'users', 'roles', 'Manage user roles'),
    
    -- Admin permissions
    ('admin.access', 'admin', 'access', 'Access admin panel'),
    ('admin.settings', 'admin', 'settings', 'Manage system settings'),
    
    -- Content permissions
    ('content.moderate', 'content', 'moderate', 'Moderate user content'),
    ('content.delete', 'content', 'delete', 'Delete user content'),
    
    -- Premium permissions
    ('premium.access', 'premium', 'access', 'Access premium features');

-- Assign permissions to roles
DO $$
DECLARE
    user_role_id UUID;
    admin_role_id UUID;
    moderator_role_id UUID;
    premium_role_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO user_role_id FROM roles WHERE name = 'user';
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
    SELECT id INTO moderator_role_id FROM roles WHERE name = 'moderator';
    SELECT id INTO premium_role_id FROM roles WHERE name = 'premium';

    -- Assign permissions to user role
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT user_role_id, id FROM permissions WHERE name IN (
        'profile.read',
        'profile.write'
    );

    -- Assign permissions to admin role (all permissions)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT admin_role_id, id FROM permissions;

    -- Assign permissions to moderator role
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT moderator_role_id, id FROM permissions WHERE name IN (
        'profile.read',
        'profile.write',
        'users.read',
        'content.moderate',
        'content.delete'
    );

    -- Assign permissions to premium role
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT premium_role_id, id FROM permissions WHERE name IN (
        'profile.read',
        'profile.write',
        'premium.access'
    );
END $$;

-- Insert default password reset email template
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