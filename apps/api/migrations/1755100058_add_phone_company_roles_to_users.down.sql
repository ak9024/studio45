-- Rollback: add_phone_company_roles_to_users
-- Created at: 2025-08-13T22:47:38-08:00

-- Remove phone column
ALTER TABLE users DROP COLUMN phone;

-- Remove company column
ALTER TABLE users DROP COLUMN company;

-- Remove roles column
ALTER TABLE users DROP COLUMN roles;