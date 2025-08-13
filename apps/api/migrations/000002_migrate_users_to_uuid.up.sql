-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add new UUID column
ALTER TABLE users ADD COLUMN uuid UUID DEFAULT uuid_generate_v4();

-- Generate UUIDs for existing records
UPDATE users SET uuid = uuid_generate_v4() WHERE uuid IS NULL;

-- Make UUID column NOT NULL
ALTER TABLE users ALTER COLUMN uuid SET NOT NULL;

-- Add unique constraint on UUID
ALTER TABLE users ADD CONSTRAINT users_uuid_unique UNIQUE (uuid);

-- Drop the old primary key constraint
ALTER TABLE users DROP CONSTRAINT users_pkey;

-- Drop the old id column
ALTER TABLE users DROP COLUMN id;

-- Rename uuid column to id
ALTER TABLE users RENAME COLUMN uuid TO id;

-- Set the new primary key
ALTER TABLE users ADD PRIMARY KEY (id);

-- Update indexes to work with UUID
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_deleted_at;

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);