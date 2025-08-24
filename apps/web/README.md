# Studio45 Web Application

A modern React web application built with TypeScript, featuring comprehensive role-based access control (RBAC), user management, and admin interfaces. Built on top of Vite for fast development and optimized production builds.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Complete user lifecycle management with admin controls
- **Role-Based Access Control**: Comprehensive RBAC system with role and permission management
- **Admin Dashboard**: Full-featured admin interface with data visualization
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Responsive Design**: Mobile-first design that works on all devices
- **Real-time Updates**: Live data synchronization with backend API
- **Type Safety**: Full TypeScript integration with type-safe API calls

## Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: React Router DOM with protected routes
- **State Management**: React Context for authentication state
- **Form Handling**: React Hook Form with Zod validation
- **HTTP Client**: Axios for API communication
- **Icons**: Lucide React icon library
- **Notifications**: Sonner for toast notifications

## Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Studio45 API server running (see `/apps/api/README.md`)

### Installation

1. **Navigate to web directory**
   ```bash
   cd apps/web
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## Environment Variables

Create a `.env` file in the web directory:

```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_APP_TITLE=Studio45
```

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8080/api/v1` |
| `VITE_APP_TITLE` | Application title | `Studio45` |

## Role-Based Access Control (RBAC) System

Studio45 implements a comprehensive RBAC system with both frontend and backend components working together to provide secure, role-based access control.

### Authentication Context

The application uses a centralized authentication context that manages user state and authentication status:

```tsx
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth()
  
  if (isLoading) {
    return <div>Loading...</div>
  }
  
  if (!isAuthenticated) {
    return <div>Please log in</div>
  }
  
  return <div>Welcome, {user.name}!</div>
}
```

**AuthContext Features:**
- JWT token management with localStorage persistence
- User profile management with role information
- Automatic token refresh and validation
- Login/logout functionality
- Loading states for auth operations

### Protected Routes

The `ProtectedRoute` component provides role-based route protection:

```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// Basic authentication required
<Route path="/dashboard" element={
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>
} />

// Admin role required
<Route path="/admin" element={
  <ProtectedRoute requiredRoles={['admin']}>
    <AdminPanel />
  </ProtectedRoute>
} />

// Multiple roles allowed
<Route path="/moderator" element={
  <ProtectedRoute requiredRoles={['admin', 'moderator']}>
    <ModerationTools />
  </ProtectedRoute>
} />
```

**ProtectedRoute Features:**
- Automatic redirection to login page for unauthenticated users
- Role-based access control with flexible role requirements
- Loading states during authentication checks
- Access denied page for insufficient permissions
- Preservation of intended destination after login

### Role-Based Access Control Patterns

The current system implements several role-based access control patterns:

#### Role Checking Hooks

The application provides custom hooks for role-based logic:

```tsx
import { useHasRole, useIsAdmin } from '@/hooks/useHasRole'

function MyComponent() {
  const hasAdminRole = useHasRole('admin')
  const hasMultipleRoles = useHasRole(['admin', 'moderator'])  
  const isAdmin = useIsAdmin()

  if (isAdmin) {
    return <AdminPanel />
  }

  if (hasMultipleRoles) {
    return <ModerationTools />
  }

  return <StandardView />
}
```

**Available Hooks:**
- `useHasRole(role)` - Check for a single role
- `useHasRole(roles[])` - Check if user has any of the specified roles  
- `useIsAdmin()` - Convenience hook to check for admin role

#### Role-Based Navigation

The sidebar automatically filters navigation items based on user roles:

```tsx
// Sidebar configuration with role requirements
const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: [] }, // Available to all
  { name: "Analytics", href: "/analytics", icon: BarChart3, roles: [] },
  { name: "Users", href: "/users", icon: Users, roles: ['admin'] }, // Admin only
  { name: "Settings", href: "/settings", icon: Settings, roles: ['admin'] },
]

// Automatic filtering based on user roles
const filteredNavigation = navigation.filter(item => {
  if (item.roles.length === 0) return true // Available to all authenticated users
  return user?.roles?.some(role => item.roles.includes(role))
})
```

#### Component-Level Role Checks

Use role checks for conditional rendering within components:

```tsx
function ToolbarComponent() {
  const { user } = useAuth()
  const isAdmin = useIsAdmin()
  const hasModerationRole = useHasRole(['admin', 'moderator'])

  return (
    <div className="toolbar">
      <Button>Standard Action</Button>
      
      {hasModerationRole && (
        <Button variant="outline">Moderate Content</Button>
      )}
      
      {isAdmin && (
        <Button variant="destructive">Delete User</Button>
      )}
    </div>
  )
}
```

### RBAC UI Components

The application includes comprehensive UI components for managing roles and permissions:

#### RolesDataTable

Advanced data table for displaying and managing system roles:

```tsx
import { RolesDataTable } from '@/components/settings/RolesDataTable'

<RolesDataTable
  roles={roles}
  loading={isLoading}
  onEditRole={(role) => setEditingRole(role)}
  onDeleteRole={(roleId) => handleDeleteRole(roleId)}
  onManagePermissions={(role) => setManagingPermissions(role)}
/>
```

**Props:**
- `roles: Role[]` - Array of role objects to display
- `loading: boolean` - Loading state for the table
- `onEditRole: (role: Role) => void` - Callback for editing a role
- `onDeleteRole: (roleId: string) => void` - Callback for deleting a role
- `onManagePermissions: (role: Role) => void` - Callback for managing role permissions

**Features:**
- Search and filter functionality
- Sortable columns (name, description, created date)
- Action buttons for edit, delete, and permission management
- Empty states and loading indicators
- Responsive design with mobile support
- System role protection (prevents deletion of core roles)

#### RoleFormDialog

Modal dialog for creating and editing roles:

```tsx
import { RoleFormDialog } from '@/components/settings/RoleFormDialog'

<RoleFormDialog
  open={isDialogOpen}
  onOpenChange={setIsDialogOpen}
  role={selectedRole} // null for create mode
  onSuccess={() => {
    setIsDialogOpen(false)
    refreshRoles()
  }}
/>
```

**Props:**
- `open: boolean` - Controls dialog visibility
- `onOpenChange: (open: boolean) => void` - Dialog state change handler
- `role?: Role | null` - Role to edit (null/undefined for create mode)
- `onSuccess: () => void` - Callback for successful create/update operations

**Features:**
- Form validation with real-time feedback
- Support for both create and edit modes
- Auto-populated fields in edit mode
- Error handling with toast notifications
- Keyboard navigation and accessibility support

#### PermissionsDataTable

Data table component for displaying and managing system permissions:

```tsx
import { PermissionsDataTable } from '@/components/settings/PermissionsDataTable'

<PermissionsDataTable
  permissions={permissions}
  loading={isLoading}
  onEditPermission={(permission) => setEditingPermission(permission)}
  onDeletePermission={(permissionId) => handleDeletePermission(permissionId)}
/>
```

**Props:**
- `permissions: Permission[]` - Array of permission objects
- `loading: boolean` - Loading state
- `onEditPermission: (permission: Permission) => void` - Edit callback
- `onDeletePermission: (permissionId: string) => void` - Delete callback

**Features:**
- Display permission name, resource, action, and description
- Color-coded resource badges for easy categorization
- Search and filter by name, resource, or action
- Sortable columns with persistent sort state
- Bulk selection capabilities
- Action column with edit/delete buttons

#### PermissionFormDialog

Modal dialog for creating and editing permissions:

```tsx
import { PermissionFormDialog } from '@/components/settings/PermissionFormDialog'

<PermissionFormDialog
  open={isDialogOpen}
  onOpenChange={setIsDialogOpen}
  permission={selectedPermission}
  onSuccess={() => {
    setIsDialogOpen(false)
    refreshPermissions()
  }}
/>
```

**Props:**
- `open: boolean` - Dialog visibility state
- `onOpenChange: (open: boolean) => void` - State change handler
- `permission?: Permission | null` - Permission to edit
- `onSuccess: () => void` - Success callback

**Features:**
- Resource and action field validation
- Auto-generation of permission names (resource.action format)
- Character limits and validation for description field
- Form persistence during editing sessions
- Comprehensive error handling and user feedback

#### RolePermissionsDialog

Advanced dialog for managing role-permission assignments:

```tsx
import { RolePermissionsDialog } from '@/components/settings/RolePermissionsDialog'

<RolePermissionsDialog
  open={isDialogOpen}
  onOpenChange={setIsDialogOpen}
  role={selectedRole}
  onSuccess={() => {
    refreshRoles()
    toast.success('Permissions updated successfully')
  }}
/>
```

**Props:**
- `open: boolean` - Dialog visibility
- `onOpenChange: (open: boolean) => void` - Visibility handler
- `role: Role | null` - Role to manage permissions for
- `onSuccess: () => void` - Success callback

**Features:**
- Checkbox-based permission selection interface
- Search and filter permissions by name or resource
- Group permissions by resource type
- Bulk select/deselect operations
- Real-time permission count updates
- System role protection (admin role permissions)
- Visual indication of current vs. new permission assignments

## Implementing Permission-Based Access Control

While the current system provides role-based access control, you can extend it to implement granular permission-based features. Here's how to implement permission-based access control:

### Permission Checking Hooks

Create custom hooks for permission-based logic:

```tsx
// src/hooks/usePermissions.ts
import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { adminService } from '@/services/api'
import { type Permission } from '@/types/api.types'

export function useUserPermissions() {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.id) return

    const fetchPermissions = async () => {
      try {
        setLoading(true)
        const response = await adminService.getUserPermissions(user.id)
        setPermissions(response.data?.permissions || [])
      } catch (error) {
        console.error('Failed to fetch user permissions:', error)
        setPermissions([])
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [user?.id])

  return { permissions, loading }
}

export function useHasPermission(permissionName: string): boolean {
  const { permissions } = useUserPermissions()
  return permissions.some(p => p.name === permissionName)
}

export function useHasAnyPermission(permissionNames: string[]): boolean {
  const { permissions } = useUserPermissions()
  return permissionNames.some(name => 
    permissions.some(p => p.name === name)
  )
}

export function useHasAllPermissions(permissionNames: string[]): boolean {
  const { permissions } = useUserPermissions()
  return permissionNames.every(name => 
    permissions.some(p => p.name === name)
  )
}
```

### Permission Guard Components

Create reusable components for permission-based rendering:

```tsx
// src/components/auth/PermissionGuard.tsx
import { type ReactNode } from 'react'
import { useHasPermission, useHasAnyPermission, useHasAllPermissions } from '@/hooks/usePermissions'

interface PermissionGuardProps {
  children: ReactNode
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  fallback?: ReactNode
}

export function PermissionGuard({ 
  children, 
  permission, 
  permissions, 
  requireAll = false,
  fallback = null 
}: PermissionGuardProps) {
  let hasPermission = false

  if (permission) {
    hasPermission = useHasPermission(permission)
  } else if (permissions) {
    hasPermission = requireAll 
      ? useHasAllPermissions(permissions)
      : useHasAnyPermission(permissions)
  }

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Usage examples
function ExampleComponent() {
  return (
    <div>
      {/* Single permission check */}
      <PermissionGuard permission="users.delete">
        <Button variant="destructive">Delete User</Button>
      </PermissionGuard>

      {/* Multiple permissions (any) */}
      <PermissionGuard permissions={['content.moderate', 'content.delete']}>
        <ModerationTools />
      </PermissionGuard>

      {/* Multiple permissions (all required) */}
      <PermissionGuard permissions={['admin.access', 'users.write']} requireAll>
        <AdminUserManagement />
      </PermissionGuard>

      {/* With fallback content */}
      <PermissionGuard 
        permission="premium.access" 
        fallback={<UpgradePrompt />}
      >
        <PremiumFeatures />
      </PermissionGuard>
    </div>
  )
}
```

### Permission-Based Routing

Extend the ProtectedRoute component for permission-based access:

```tsx
// src/components/auth/PermissionRoute.tsx  
import { type ReactNode } from 'react'
import { useHasPermission, useHasAnyPermission } from '@/hooks/usePermissions'
import { ProtectedRoute } from './ProtectedRoute'
import { AccessDenied } from './AccessDenied'

interface PermissionRouteProps {
  children: ReactNode
  permission?: string
  permissions?: string[]
  requireAll?: boolean
}

export function PermissionRoute({ 
  children, 
  permission, 
  permissions,
  requireAll = false 
}: PermissionRouteProps) {
  return (
    <ProtectedRoute>
      <PermissionCheck 
        permission={permission}
        permissions={permissions}
        requireAll={requireAll}
      >
        {children}
      </PermissionCheck>
    </ProtectedRoute>
  )
}

function PermissionCheck({ children, permission, permissions, requireAll }: {
  children: ReactNode
  permission?: string
  permissions?: string[]
  requireAll?: boolean
}) {
  let hasPermission = false

  if (permission) {
    hasPermission = useHasPermission(permission)
  } else if (permissions) {
    hasPermission = requireAll 
      ? useHasAllPermissions(permissions)
      : useHasAnyPermission(permissions)
  }

  if (!hasPermission) {
    return <AccessDenied />
  }

  return <>{children}</>
}

// Usage in routing
<Routes>
  <Route path="/admin/users/delete" element={
    <PermissionRoute permission="users.delete">
      <UserDeletionPage />
    </PermissionRoute>
  } />
  
  <Route path="/moderation" element={
    <PermissionRoute permissions={['content.moderate', 'content.delete']}>
      <ModerationPanel />
    </PermissionRoute>
  } />
</Routes>
```

### Advanced Permission Patterns

#### Context-Based Permissions

For more complex scenarios, implement context-aware permissions:

```tsx
// Context-based permission checking
function useCanEditUser(userId: string): boolean {
  const { user } = useAuth()
  const hasGlobalEdit = useHasPermission('users.edit')
  const hasOwnEdit = useHasPermission('users.edit.own')
  
  // Can edit if has global permission OR owns the resource
  return hasGlobalEdit || (hasOwnEdit && user?.id === userId)
}

function UserEditButton({ targetUserId }: { targetUserId: string }) {
  const canEdit = useCanEditUser(targetUserId)
  
  return (
    <Button disabled={!canEdit}>
      {canEdit ? 'Edit User' : 'No Permission'}
    </Button>
  )
}
```

#### Resource-Based Permissions

Check permissions for specific resources:

```tsx
function useResourcePermission(resource: string, action: string): boolean {
  const permissionName = `${resource}.${action}`
  return useHasPermission(permissionName)
}

function DocumentControls({ document }: { document: Document }) {
  const canEdit = useResourcePermission('documents', 'edit')
  const canDelete = useResourcePermission('documents', 'delete')
  const canPublish = useResourcePermission('documents', 'publish')

  return (
    <div className="document-controls">
      {canEdit && <Button>Edit</Button>}
      {canDelete && <Button variant="destructive">Delete</Button>}
      {canPublish && <Button>Publish</Button>}
    </div>
  )
}
```

### Form Field-Level Permissions

Control form field access based on permissions:

```tsx
function UserEditForm({ user }: { user: User }) {
  const canEditEmail = useHasPermission('users.edit.email')
  const canEditRoles = useHasPermission('users.edit.roles')
  const canEditPassword = useHasPermission('users.edit.password')

  return (
    <form>
      <Input 
        placeholder="Name" 
        defaultValue={user.name}
      />
      
      <Input 
        placeholder="Email" 
        defaultValue={user.email}
        disabled={!canEditEmail}
        title={!canEditEmail ? "No permission to edit email" : undefined}
      />
      
      <PermissionGuard permission="users.edit.password">
        <Input 
          type="password" 
          placeholder="New Password"
        />
      </PermissionGuard>
      
      {canEditRoles && (
        <RoleSelector 
          selectedRoles={user.roles}
          onChange={handleRoleChange}
        />
      )}
      
      <Button type="submit">
        Save Changes
      </Button>
    </form>
  )
}
```

## API Integration

The application includes a comprehensive API service layer for type-safe backend communication:

### Authentication Services

```tsx
import { authService } from '@/services/api'

// User authentication
const loginResponse = await authService.login(email, password)
const registerResponse = await authService.register(name, email, password)

// Password reset flow
await authService.forgotPassword(email)
await authService.resetPassword(token, newPassword)

// Token management
const token = authService.getToken()
const user = authService.getUser()
authService.logout()
```

### Admin Services

```tsx
import { adminService } from '@/services/api'

// Role management
const roles = await adminService.getRoles()
const role = await adminService.getRole(roleId)
const newRole = await adminService.createRole({ name, description })
const updatedRole = await adminService.updateRole(roleId, updates)
await adminService.deleteRole(roleId)

// Permission management
const permissions = await adminService.getPermissions()
const permission = await adminService.getPermission(permissionId)
const newPermission = await adminService.createPermission({
  name, resource, action, description
})
await adminService.updatePermission(permissionId, updates)
await adminService.deletePermission(permissionId)

// Role-permission assignments
await adminService.updateRolePermissions(roleId, { 
  permission_ids: [id1, id2, id3] 
})

// User management
const users = await adminService.getUsers()
const user = await adminService.getUser(userId)
await adminService.updateUserRoles(userId, { roles: ['admin', 'user'] })
await adminService.deleteUser(userId)

// Permission checking
const userPermissions = await adminService.getUserPermissions(userId)
const hasPermission = await adminService.checkUserPermission(userId, 'users.delete')
```

### Permission API Integration Patterns

When implementing permission-based features, consider these API integration patterns:

#### Caching User Permissions

```tsx
// src/hooks/usePermissionsCache.ts
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { adminService } from '@/services/api'
import { type Permission } from '@/types/api.types'

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const permissionsCache = new Map<string, {
  permissions: Permission[]
  timestamp: number
}>()

export function useCachedPermissions() {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPermissions = useCallback(async (userId: string, force = false) => {
    const cached = permissionsCache.get(userId)
    const now = Date.now()
    
    // Use cache if available and not expired
    if (!force && cached && (now - cached.timestamp < CACHE_DURATION)) {
      setPermissions(cached.permissions)
      return cached.permissions
    }

    try {
      setLoading(true)
      const response = await adminService.getUserPermissions(userId)
      const userPermissions = response.data?.permissions || []
      
      // Cache the results
      permissionsCache.set(userId, {
        permissions: userPermissions,
        timestamp: now
      })
      
      setPermissions(userPermissions)
      return userPermissions
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
      setPermissions([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const clearCache = useCallback((userId?: string) => {
    if (userId) {
      permissionsCache.delete(userId)
    } else {
      permissionsCache.clear()
    }
  }, [])

  useEffect(() => {
    if (user?.id) {
      fetchPermissions(user.id)
    }
  }, [user?.id, fetchPermissions])

  return { 
    permissions, 
    loading, 
    fetchPermissions, 
    clearCache 
  }
}
```

#### Optimistic Permission Updates

```tsx
// Optimistic updates for better UX
function useOptimisticPermissions() {
  const [optimisticPermissions, setOptimisticPermissions] = useState<Set<string>>(new Set())
  const { permissions } = useCachedPermissions()

  const hasPermission = useCallback((permissionName: string) => {
    return optimisticPermissions.has(permissionName) || 
           permissions.some(p => p.name === permissionName)
  }, [permissions, optimisticPermissions])

  const grantOptimistic = useCallback((permissionName: string) => {
    setOptimisticPermissions(prev => new Set(prev).add(permissionName))
  }, [])

  const revokeOptimistic = useCallback((permissionName: string) => {
    setOptimisticPermissions(prev => {
      const next = new Set(prev)
      next.delete(permissionName)
      return next
    })
  }, [])

  const clearOptimistic = useCallback(() => {
    setOptimisticPermissions(new Set())
  }, [])

  return {
    hasPermission,
    grantOptimistic,
    revokeOptimistic,
    clearOptimistic
  }
}

// Usage in components
function QuickActionButton({ action, userId }: { action: string, userId: string }) {
  const { hasPermission, grantOptimistic, clearOptimistic } = useOptimisticPermissions()
  const [loading, setLoading] = useState(false)

  const handleAction = async () => {
    const permissionName = `users.${action}`
    
    if (!hasPermission(permissionName)) return

    try {
      setLoading(true)
      // Optimistically assume success
      grantOptimistic(`${permissionName}.success`)
      
      await performAction(action, userId)
      toast.success(`${action} completed successfully`)
    } catch (error) {
      clearOptimistic()
      toast.error(`Failed to ${action}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleAction}
      disabled={!hasPermission(`users.${action}`) || loading}
    >
      {loading ? 'Processing...' : `${action}`}
    </Button>
  )
}
```

#### Batch Permission Checks

```tsx
// Efficient batch permission checking
function useBatchPermissionCheck(permissionNames: string[]) {
  const { permissions } = useCachedPermissions()
  
  return useMemo(() => {
    const results: Record<string, boolean> = {}
    const permissionSet = new Set(permissions.map(p => p.name))
    
    permissionNames.forEach(name => {
      results[name] = permissionSet.has(name)
    })
    
    return results
  }, [permissions, permissionNames])
}

// Usage for complex UI
function ComplexDashboard() {
  const permissionChecks = useBatchPermissionCheck([
    'users.read',
    'users.write', 
    'users.delete',
    'reports.generate',
    'settings.modify',
    'content.moderate'
  ])

  return (
    <div className="dashboard">
      {permissionChecks['users.read'] && <UsersList />}
      {permissionChecks['users.write'] && <UserCreateButton />}
      {permissionChecks['reports.generate'] && <ReportsSection />}
      {permissionChecks['settings.modify'] && <SettingsPanel />}
      
      <ActionBar>
        {permissionChecks['users.delete'] && (
          <Button variant="destructive">Bulk Delete</Button>
        )}
        {permissionChecks['content.moderate'] && (
          <Button>Moderate Content</Button>
        )}
      </ActionBar>
    </div>
  )
}
```

### Error Handling

The API services include comprehensive error handling:

```tsx
try {
  await adminService.createRole(roleData)
  toast.success('Role created successfully')
} catch (error: any) {
  if (error.status === 401) {
    toast.error('Authentication required')
    // Redirect to login
  } else if (error.status === 403) {
    toast.error('Insufficient permissions')
  } else if (error.status === 409) {
    toast.error('Role name already exists')
  } else {
    toast.error(error.message || 'An error occurred')
  }
}
```

**Error Scenarios Handled:**
- Network connectivity issues
- Authentication failures (401)
- Authorization failures (403)
- Validation errors (400)
- Conflict errors (409) - duplicate names
- Server errors (500)
- Timeout errors

## Permission System Best Practices

### When to Use Roles vs Permissions

Understanding when to use role-based vs permission-based access control:

#### Use Roles When:
- **Simple Access Levels**: Basic user types (admin, user, moderator)
- **Broad Categorization**: General access patterns across the application
- **Quick Development**: Rapid prototyping and initial development phases
- **Navigation Control**: Sidebar and menu item visibility
- **Route Protection**: Page-level access control

```tsx
// Good use of roles
const isAdmin = useIsAdmin()
const canAccessUsers = useHasRole(['admin', 'moderator'])

// Simple navigation filtering
{isAdmin && <Link to="/admin">Admin Panel</Link>}
```

#### Use Permissions When:
- **Granular Control**: Specific actions within features (create, read, update, delete)
- **Feature Flags**: Individual feature access control
- **Field-Level Security**: Form field and data access control
- **Resource-Specific**: Context-dependent access (own vs others' data)
- **Complex Business Logic**: Multi-condition access requirements

```tsx
// Good use of permissions
const canDeleteUser = useHasPermission('users.delete')
const canEditOwnProfile = useHasPermission('profile.edit.own')
const canViewReports = useHasPermission('reports.view')

// Granular feature control
<PermissionGuard permission="users.edit.email">
  <EmailField />
</PermissionGuard>
```

### Performance Considerations

#### Permission Caching Strategy

```tsx
// Implement intelligent caching
const PERMISSION_CACHE_CONFIG = {
  duration: 5 * 60 * 1000, // 5 minutes
  maxSize: 100, // Maximum cached users
  refreshThreshold: 0.8 // Refresh when 80% of cache duration has passed
}

export function usePermissionCache() {
  // Pre-fetch permissions for likely-needed resources
  const prefetchPermissions = useCallback((userIds: string[]) => {
    userIds.forEach(id => {
      if (!permissionsCache.has(id)) {
        fetchPermissions(id)
      }
    })
  }, [])

  // Background refresh before expiration
  const scheduleRefresh = useCallback((userId: string, permissions: Permission[]) => {
    const refreshTime = PERMISSION_CACHE_CONFIG.duration * PERMISSION_CACHE_CONFIG.refreshThreshold
    setTimeout(() => {
      fetchPermissions(userId, true) // Force refresh
    }, refreshTime)
  }, [])

  return { prefetchPermissions, scheduleRefresh }
}
```

#### Minimize Permission Checks

```tsx
// ❌ Inefficient - multiple permission checks
function UserRow({ user }: { user: User }) {
  const canEdit = useHasPermission('users.edit')
  const canDelete = useHasPermission('users.delete') 
  const canViewProfile = useHasPermission('users.view.profile')
  const canManageRoles = useHasPermission('users.manage.roles')
  
  return (
    <tr>
      <td>{user.name}</td>
      {canEdit && <td><EditButton /></td>}
      {canDelete && <td><DeleteButton /></td>}
      {canViewProfile && <td><ViewButton /></td>}
      {canManageRoles && <td><RoleButton /></td>}
    </tr>
  )
}

// ✅ Efficient - batch permission check
function UserRow({ user }: { user: User }) {
  const permissions = useBatchPermissionCheck([
    'users.edit', 'users.delete', 'users.view.profile', 'users.manage.roles'
  ])
  
  return (
    <tr>
      <td>{user.name}</td>
      {permissions['users.edit'] && <td><EditButton /></td>}
      {permissions['users.delete'] && <td><DeleteButton /></td>}
      {permissions['users.view.profile'] && <td><ViewButton /></td>}
      {permissions['users.manage.roles'] && <td><RoleButton /></td>}
    </tr>
  )
}
```

### Security Considerations

#### Client-Side Security Limitations

**⚠️ Important Security Notes:**

1. **Never Trust Client-Side Checks**: All permission checks must be validated on the server
2. **UI Hiding ≠ Security**: Hiding UI elements doesn't prevent direct API access
3. **Always Validate Server-Side**: Every API endpoint must enforce permissions independently

```tsx
// ❌ Insecure - only client-side protection
function DeleteUserButton({ userId }: { userId: string }) {
  const canDelete = useHasPermission('users.delete')
  
  const handleDelete = () => {
    // Direct API call without server validation
    adminService.deleteUser(userId) // VULNERABLE!
  }

  return (
    <Button 
      onClick={handleDelete}
      disabled={!canDelete}
    >
      Delete
    </Button>
  )
}

// ✅ Secure - server validates permissions
function DeleteUserButton({ userId }: { userId: string }) {
  const canDelete = useHasPermission('users.delete')
  
  const handleDelete = async () => {
    try {
      // Server validates permission before execution
      await adminService.deleteUser(userId) // Server checks permission
      toast.success('User deleted successfully')
    } catch (error: any) {
      if (error.status === 403) {
        toast.error('Permission denied')
      } else {
        toast.error('Delete failed')
      }
    }
  }

  // UI hint only - server is the source of truth
  return (
    <Button 
      onClick={handleDelete}
      disabled={!canDelete}
      title={!canDelete ? 'No permission to delete users' : ''}
    >
      Delete
    </Button>
  )
}
```

### Migration Guide

#### Gradual Migration from Roles to Permissions

**Phase 1: Add Permission Infrastructure**

```tsx
// 1. Implement permission hooks alongside existing role hooks
export function usePermissions() {
  // New permission logic
}

export function useHasRole(roles: string | string[]) {
  // Keep existing role logic for backward compatibility
}

// 2. Update types to support both systems
interface User {
  id: string
  roles: string[] // Keep existing
  permissions?: Permission[] // Add optional permissions
}
```

**Phase 2: Implement Permission Components**

```tsx
// 3. Create permission-aware components
export function AccessGuard({ 
  children, 
  role, 
  permission,
  roles,
  permissions 
}: {
  children: ReactNode
  // Support both systems during migration
  role?: string
  roles?: string[]
  permission?: string
  permissions?: string[]
}) {
  // Check both role and permission systems
  const hasRoleAccess = role ? useHasRole(role) : 
                       roles ? useHasRole(roles) : true
  
  const hasPermissionAccess = permission ? useHasPermission(permission) :
                             permissions ? useHasAnyPermission(permissions) : true

  // During migration, require EITHER system to pass
  const hasAccess = hasRoleAccess || hasPermissionAccess

  return hasAccess ? <>{children}</> : null
}
```

**Phase 3: Migrate Components Gradually**

```tsx
// Before: Role-based
<RoleGuard role="admin">
  <AdminButton />
</RoleGuard>

// During migration: Support both
<AccessGuard role="admin" permission="admin.access">
  <AdminButton />
</AccessGuard>

// After migration: Permission-based
<PermissionGuard permission="admin.access">
  <AdminButton />
</PermissionGuard>
```

#### Migration Checklist

- [ ] **Backend Integration**: Ensure API endpoints return user permissions
- [ ] **Hook Implementation**: Create permission checking hooks
- [ ] **Component Updates**: Gradually migrate components to use permissions
- [ ] **Testing**: Test both old role and new permission systems
- [ ] **Documentation**: Update component documentation with permission props
- [ ] **Performance**: Implement caching for permission checks
- [ ] **Security**: Verify server-side permission validation
- [ ] **Cleanup**: Remove deprecated role checks after full migration

### Common Patterns and Examples

#### Multi-Tenant Permission Patterns

```tsx
// Organization-scoped permissions
function useOrganizationPermission(orgId: string, permission: string) {
  const fullPermission = `org.${orgId}.${permission}`
  return useHasPermission(fullPermission)
}

function OrganizationUserManager({ orgId }: { orgId: string }) {
  const canManageUsers = useOrganizationPermission(orgId, 'users.manage')
  const canViewUsers = useOrganizationPermission(orgId, 'users.view')

  return (
    <div>
      {canViewUsers && <UsersList orgId={orgId} />}
      {canManageUsers && <UserManagementTools orgId={orgId} />}
    </div>
  )
}
```

#### Time-Based Permissions

```tsx
function useTemporalPermission(permission: string, context?: any) {
  const hasBasePermission = useHasPermission(permission)
  const [isWithinTimeWindow, setIsWithinTimeWindow] = useState(false)

  useEffect(() => {
    // Check if current time allows the permission
    const checkTimeWindow = () => {
      const now = new Date()
      const hour = now.getHours()
      
      // Example: Some operations only allowed during business hours
      if (permission.includes('financial') && (hour < 9 || hour > 17)) {
        setIsWithinTimeWindow(false)
      } else {
        setIsWithinTimeWindow(true)
      }
    }

    checkTimeWindow()
    const interval = setInterval(checkTimeWindow, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [permission])

  return hasBasePermission && isWithinTimeWindow
}
```

## Component Architecture

### Project Structure

```
apps/web/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── auth/          # Authentication components
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── AccessDenied.tsx
│   │   ├── layout/        # Layout components
│   │   │   └── DashboardLayout.tsx
│   │   ├── settings/      # RBAC management components
│   │   │   ├── RolesDataTable.tsx
│   │   │   ├── RoleFormDialog.tsx
│   │   │   ├── PermissionsDataTable.tsx
│   │   │   ├── PermissionFormDialog.tsx
│   │   │   └── RolePermissionsDialog.tsx
│   │   └── ui/            # shadcn/ui base components
│   ├── contexts/          # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/             # Custom React hooks
│   │   └── useAuth.ts
│   ├── pages/             # Application pages
│   │   ├── auth/          # Authentication pages
│   │   ├── dashboard/     # Dashboard page
│   │   ├── users/         # User management
│   │   ├── settings/      # Settings and RBAC management
│   │   └── profile/       # User profile
│   ├── services/          # API service layer
│   │   └── api/           # API client functions
│   ├── types/             # TypeScript type definitions
│   │   └── api.types.ts
│   ├── lib/               # Utility functions
│   │   └── utils.ts
│   └── App.tsx            # Main application component
├── package.json
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── vite.config.ts         # Vite configuration
└── README.md             # This file
```

### Design Patterns

**Container/Presentational Pattern:**
- Page components handle data fetching and state management
- UI components focus on presentation and user interaction
- Clear separation of concerns between logic and UI

**Custom Hooks:**
- `useAuth` - Authentication state and operations
- Reusable hooks for common functionality
- Separation of business logic from components

**Type Safety:**
- Comprehensive TypeScript interfaces for all API data
- Type-safe API service methods
- Strongly typed component props and state

## Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
tsc -b

# Run ESLint
npm run lint

# Preview production build
npm run preview
```

### Development Workflow

1. **Component Development:**
   - Create components in appropriate directories
   - Follow naming conventions (PascalCase for components)
   - Include TypeScript interfaces for props
   - Add comprehensive error handling

2. **API Integration:**
   - Define TypeScript interfaces in `types/api.types.ts`
   - Implement API methods in `services/api/`
   - Handle errors consistently across the application
   - Use loading states for better UX

3. **Styling:**
   - Use Tailwind CSS utility classes
   - Leverage shadcn/ui components for consistency
   - Follow responsive design principles
   - Maintain consistent spacing and typography

### Code Quality

- **ESLint Configuration:** Comprehensive linting rules for React and TypeScript
- **Type Checking:** Full TypeScript coverage with strict mode enabled
- **Component Testing:** Test components with React Testing Library
- **Accessibility:** WCAG 2.1 compliance with proper ARIA labels

## Deployment

### Build Configuration

The application uses Vite for optimized production builds:

```bash
# Build for production
npm run build

# Output directory: dist/
```

### Environment Configuration

For production deployment:

1. Set production environment variables
2. Configure API_URL to point to production backend
3. Enable HTTPS and security headers
4. Set up CDN for static assets
5. Configure error monitoring and analytics

### Docker Support

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the code style guidelines
4. Add/update tests for new functionality
5. Ensure all tests pass and linting is clean
6. Commit your changes (`git commit -m 'Add some amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions and support:

1. Check the [API Documentation](../api/docs/RBAC_SYSTEM.md)
2. Review existing issues in the repository
3. Create a new issue with detailed information about your problem

---

**Built with ❤️ by the @ak9024**