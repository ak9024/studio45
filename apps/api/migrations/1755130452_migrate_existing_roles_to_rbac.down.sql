-- Rollback migration: Convert RBAC system back to array-based roles
-- WARNING: This will lose audit trail information (granted_by, granted_at, expires_at)

DO $$
DECLARE
    user_record RECORD;
    user_roles_array TEXT[];
BEGIN
    -- Convert user_roles back to roles array for each user
    FOR user_record IN 
        SELECT DISTINCT ur.user_id
        FROM user_roles ur
    LOOP
        -- Get all role names for this user
        SELECT ARRAY_AGG(r.name) INTO user_roles_array
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = user_record.user_id;

        -- Update the user's roles array
        UPDATE users 
        SET roles = user_roles_array
        WHERE id = user_record.user_id;
        
        RAISE NOTICE 'Restored roles array for user %: %', user_record.user_id, user_roles_array;
    END LOOP;

    -- Clear the user_roles table
    DELETE FROM user_roles;
    
    RAISE NOTICE 'Successfully rolled back RBAC migration';
END $$;