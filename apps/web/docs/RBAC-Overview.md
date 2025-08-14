# RBAC System Overview

## Introduction

This application implements a comprehensive Role-Based Access Control (RBAC) system that provides fine-grained access control to different parts of the application based on user roles. The system is built with React, TypeScript, and integrates seamlessly with the backend API.

## Architecture Overview

The RBAC system consists of several key components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AuthContext   │────│   useAuth Hook  │────│  Route Guards   │
│                 │    │                 │    │                 │
│ - User state    │    │ - Role checking │    │ - ProtectedRoute│
│ - Token mgmt    │    │ - Auth utils    │    │ - AdminRoute    │
│ - Role methods  │    │                 │    │ - RoleGuard     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Auth Service  │
                    │                 │
                    │ - API calls     │
                    │ - Token storage │
                    │ - User storage  │
                    └─────────────────┘
```

## Available Roles

The system currently supports four predefined roles:

| Role | Description | Access Level |
|------|-------------|--------------|
| `user` | Default role for all registered users | Basic application access |
| `admin` | Administrative privileges | Full system access, user management |
| `moderator` | Content moderation capabilities | Elevated permissions for content management |
| `premium` | Premium feature access | Enhanced features and capabilities |

## Key Features

### 🔐 Authentication & Authorization
- JWT-based token authentication
- Automatic token validation and refresh
- Secure token storage in localStorage
- Role-based access control

### 🛡️ Route Protection
- **ProtectedRoute**: Requires authentication and optional role requirements
- **AdminRoute**: Specifically for admin-only pages
- **RoleGuard**: Component-level access control

### 👥 User Management
- Admin dashboard for user role management
- Real-time role updates
- User deletion capabilities
- Comprehensive user information display

### 🔍 Role Checking Utilities
- `hasRole(role)`: Check for a specific role
- `hasAnyRole(roles[])`: Check if user has any of the specified roles
- `hasAllRoles(roles[])`: Check if user has all specified roles
- `isAdmin`: Convenience property for admin role checking

## Security Considerations

### Token Security
- JWT tokens are stored in localStorage
- Automatic token expiration checking
- Token cleanup on logout
- Bearer token authentication headers

### Role Validation
- Server-side role validation for all protected endpoints
- Client-side role checking for UI/UX optimization
- Role changes require admin privileges
- Secure role assignment through dedicated endpoints

### Access Control
- Principle of least privilege
- Role-based component rendering
- Protected API endpoints
- Automatic redirection for unauthorized access

## File Structure

```
src/
├── components/
│   ├── AdminRoute.tsx         # Admin-only route protection
│   ├── ProtectedRoute.tsx     # General authentication protection
│   └── RoleGuard.tsx          # Component-level role protection
├── contexts/
│   ├── AuthContext.tsx        # Authentication state management
│   └── auth-context.ts        # Type definitions
├── hooks/
│   └── useAuth.ts             # Authentication utilities hook
├── services/
│   ├── auth.service.ts        # Authentication API calls
│   └── admin.service.ts       # Admin management API calls
└── pages/
    └── AdminDashboard.tsx     # User management interface
```

## Integration Points

### Frontend Components
- All components can access auth state via `useAuth()` hook
- Role-based conditional rendering throughout the application
- Automatic redirection based on authentication status

### Backend API
- `/api/v1/auth/*` - Authentication endpoints
- `/api/v1/admin/*` - Admin management endpoints
- Bearer token authentication for protected routes
- Role validation middleware on server-side

## Getting Started

To implement RBAC in your components:

1. **Use the `useAuth` hook** to access authentication state
2. **Wrap protected routes** with appropriate guards
3. **Check roles** before rendering sensitive components
4. **Handle unauthorized access** gracefully

For detailed implementation examples, see [RBAC-Usage-Examples.md](./RBAC-Usage-Examples.md).

## Best Practices

1. **Always validate roles on the server-side** - Client-side checks are for UX only
2. **Use the principle of least privilege** - Grant minimal necessary permissions
3. **Implement graceful fallbacks** - Handle unauthorized access elegantly
4. **Keep role logic centralized** - Use the provided utilities consistently
5. **Test role-based access thoroughly** - Verify all permission scenarios

## Related Documentation

- [Implementation Guide](./RBAC-Implementation-Guide.md)
- [API Reference](./RBAC-API-Reference.md)
- [Usage Examples](./RBAC-Usage-Examples.md)
- [Testing Guide](./RBAC-Testing-Guide.md)