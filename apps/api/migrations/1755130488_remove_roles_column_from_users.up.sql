-- Remove the roles column from users table after migration to RBAC
-- This should be run AFTER migrating existing data to the RBAC system

-- Remove the roles column
ALTER TABLE users DROP COLUMN IF EXISTS roles;