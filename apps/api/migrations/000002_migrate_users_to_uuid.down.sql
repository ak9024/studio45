-- Add back the integer id column
ALTER TABLE users ADD COLUMN int_id SERIAL;

-- Drop the UUID primary key
ALTER TABLE users DROP CONSTRAINT users_pkey;

-- Rename current id to uuid
ALTER TABLE users RENAME COLUMN id TO uuid;

-- Rename int_id to id
ALTER TABLE users RENAME COLUMN int_id TO id;

-- Set integer id as primary key
ALTER TABLE users ADD PRIMARY KEY (id);

-- Drop the UUID unique constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_uuid_unique;

-- Drop the UUID column
ALTER TABLE users DROP COLUMN uuid;

-- Recreate indexes
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_deleted_at;

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);