-- Rollback initial schema migration
-- This will drop all tables and extensions created in the up migration

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop the shared trigger function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop extensions (only if not used by other schemas)
-- Uncomment the line below if you want to completely remove UUID support
-- DROP EXTENSION IF EXISTS "uuid-ossp";