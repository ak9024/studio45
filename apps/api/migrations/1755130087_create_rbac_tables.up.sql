-- Create roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role_permissions mapping table
CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

-- Create user_roles mapping table
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by UUID REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, role_id)
);

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

-- Get role IDs for permission assignment
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

-- Create indexes for better performance
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);

-- Add updated_at trigger for roles table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();