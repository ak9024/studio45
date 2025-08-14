-- Set default role 'user' for existing users that have null or empty roles
UPDATE users 
SET roles = ARRAY['user']
WHERE roles IS NULL OR roles = '{}';

-- Create an admin user if no admin exists (optional - you can remove this if not needed)
-- Make sure to replace 'admin@example.com' with your desired admin email
DO $$
BEGIN
    -- Check if any admin user exists
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE 'admin' = ANY(roles)
    ) THEN
        -- Update the first user to be admin (or create one if none exist)
        -- You should replace this with your actual admin user creation logic
        UPDATE users 
        SET roles = ARRAY['admin', 'user']
        WHERE id = (SELECT id FROM users ORDER BY created_at LIMIT 1);
        
        -- Log that we've created an admin
        RAISE NOTICE 'First user has been granted admin privileges';
    END IF;
END
$$;