-- Migration: add_phone_company_roles_to_users
-- Created at: 2025-08-13T22:47:38-08:00

-- Add phone column
ALTER TABLE users ADD COLUMN phone VARCHAR(50);

-- Add company column
ALTER TABLE users ADD COLUMN company VARCHAR(255);

-- Add roles column as text array
ALTER TABLE users ADD COLUMN roles TEXT[] DEFAULT '{}';