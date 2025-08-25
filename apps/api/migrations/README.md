# Database Migrations

This directory contains database migration files for the Studio45 API.

## Migration Strategy

### Fresh Deployments
For new deployments, use the consolidated `000001_initial_schema.up.sql` migration which creates the complete database schema in a single step.

### Existing Deployments
Existing databases should continue using the incremental migrations located in the `archived/` directory.

## Directory Structure

```
migrations/
├── README.md                          # This file
├── 000001_initial_schema.up.sql      # Fresh setup migration (consolidated)
├── 000001_initial_schema.down.sql    # Rollback for fresh setup
└── archived/                          # Legacy incremental migrations
    ├── 000001_create_users_table.up.sql
    ├── 000002_migrate_users_to_uuid.up.sql
    ├── ...
    └── (all previous migrations)
```

## Commands

All migration commands are run through the main application binary:

```bash
# Check current migration status
go run . migrate status

# Apply all pending migrations
go run . migrate up

# Rollback all migrations  
go run . migrate down

# Apply/rollback specific number of steps
go run . migrate steps 1    # Apply 1 migration
go run . migrate steps -1   # Rollback 1 migration

# Force set migration version (use with caution)
go run . migrate force 1

# Create new migration file
go run . migrate create migration_name
```

## Fresh Setup Process

For new databases, simply run:

```bash
go run . migrate up
```

This will apply the consolidated initial schema migration, creating:
- Users table with UUID primary keys
- RBAC system (roles, permissions, user_roles, role_permissions)
- Password reset tokens table
- Email templates table
- All necessary indexes and triggers
- Default roles and permissions
- Default email templates

## Schema Overview

The consolidated migration creates:

### Core Tables
- `users` - User accounts with UUID primary keys
- `password_reset_tokens` - Password reset functionality
- `email_templates` - Email template management

### RBAC System
- `roles` - User roles (user, admin, moderator, premium)
- `permissions` - System permissions with resource/action structure
- `role_permissions` - Many-to-many mapping of roles to permissions
- `user_roles` - Many-to-many mapping of users to roles

### Default Data
- **Roles**: user, admin, moderator, premium
- **Permissions**: Comprehensive set covering profile, users, admin, content, and premium access
- **Email Templates**: Password reset template with modern HTML styling

## Migration Numbering

- `000001` - Initial consolidated schema (for fresh setups)
- `000002+` - Future incremental migrations

## Best Practices

1. **Always backup** your database before running migrations in production
2. **Test migrations** in development/staging environments first
3. **Use transactions** in migration files when possible
4. **Keep migrations small** and focused on single concerns
5. **Never modify** existing migration files once they've been applied
6. **Use descriptive names** for new migrations

## Troubleshooting

### Migration Fails
```bash
# Check current status
go run . migrate status

# Force set version if needed (use carefully)
go run . migrate force [version]
```

### Fresh Setup vs Incremental
- **Fresh databases**: Use the current migration structure (starts with 000001)
- **Existing databases**: Contact the development team for upgrade path from archived migrations

## Environment Variables

Set `MIGRATION_PATH` to override the default migration directory:

```bash
MIGRATION_PATH=/custom/path/to/migrations go run . migrate up
```