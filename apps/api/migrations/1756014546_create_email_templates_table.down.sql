-- Rollback: create_email_templates_table
-- Created at: 2025-08-24T12:49:06+07:00

-- Drop trigger
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop table
DROP TABLE IF EXISTS email_templates;

