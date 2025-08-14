-- Revert default roles (set back to empty array or null)
-- Warning: This will remove all role assignments
UPDATE users SET roles = '{}' WHERE roles IS NOT NULL;