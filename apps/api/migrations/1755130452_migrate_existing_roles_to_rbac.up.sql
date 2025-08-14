-- Migration to convert existing array-based roles to normalized RBAC system
-- This migration should be run AFTER the RBAC tables have been created

DO $$
DECLARE
    user_record RECORD;
    role_name TEXT;
    user_role_id UUID;
    admin_role_id UUID;
    first_user_id UUID;
    admin_count INTEGER;
BEGIN
    -- Get role IDs
    SELECT id INTO user_role_id FROM roles WHERE name = 'user';
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
    
    -- Ensure we have the basic roles
    IF user_role_id IS NULL THEN
        RAISE EXCEPTION 'User role not found. Please run RBAC tables migration first.';
    END IF;
    
    IF admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Admin role not found. Please run RBAC tables migration first.';
    END IF;

    -- Convert existing users with roles array to user_roles table
    FOR user_record IN 
        SELECT id, roles FROM users 
        WHERE roles IS NOT NULL AND array_length(roles, 1) > 0
    LOOP
        -- Process each role for this user
        FOREACH role_name IN ARRAY user_record.roles
        LOOP
            -- Insert into user_roles if the role exists and assignment doesn't exist
            INSERT INTO user_roles (user_id, role_id, granted_at)
            SELECT user_record.id, r.id, NOW()
            FROM roles r
            WHERE r.name = role_name
            AND NOT EXISTS (
                SELECT 1 FROM user_roles ur 
                WHERE ur.user_id = user_record.id AND ur.role_id = r.id
            );
        END LOOP;
        
        RAISE NOTICE 'Migrated roles for user %: %', user_record.id, user_record.roles;
    END LOOP;

    -- Handle users with NULL or empty roles array - assign default 'user' role
    INSERT INTO user_roles (user_id, role_id, granted_at)
    SELECT u.id, user_role_id, NOW()
    FROM users u
    WHERE (u.roles IS NULL OR array_length(u.roles, 1) IS NULL OR array_length(u.roles, 1) = 0)
    AND NOT EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = u.id AND ur.role_id = user_role_id
    );

    -- Check if we have any admin users
    SELECT COUNT(*) INTO admin_count
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE r.name = 'admin';

    -- If no admin users exist, make the first user an admin
    IF admin_count = 0 THEN
        SELECT id INTO first_user_id 
        FROM users 
        WHERE deleted_at IS NULL
        ORDER BY created_at 
        LIMIT 1;

        IF first_user_id IS NOT NULL THEN
            -- Assign admin role to first user
            INSERT INTO user_roles (user_id, role_id, granted_at)
            VALUES (first_user_id, admin_role_id, NOW())
            ON CONFLICT (user_id, role_id) DO NOTHING;
            
            -- Also ensure they have user role
            INSERT INTO user_roles (user_id, role_id, granted_at)
            VALUES (first_user_id, user_role_id, NOW())
            ON CONFLICT (user_id, role_id) DO NOTHING;

            RAISE NOTICE 'Granted admin privileges to first user: %', first_user_id;
        END IF;
    END IF;

    RAISE NOTICE 'Successfully migrated % users to RBAC system', 
        (SELECT COUNT(DISTINCT user_id) FROM user_roles);
END $$;