-- Restore the roles column to users table
-- This adds back the roles array column (data will need to be re-migrated)

-- Add back the roles column
ALTER TABLE users ADD COLUMN roles TEXT[] DEFAULT '{}';

-- Create index for roles array queries
CREATE INDEX IF NOT EXISTS idx_users_roles ON users USING GIN(roles);