# RBAC Usage Examples

## Table of Contents
1. [Basic Authentication](#basic-authentication)
2. [Route Protection](#route-protection)
3. [Component-Level Protection](#component-level-protection)
4. [Conditional Rendering](#conditional-rendering)
5. [Admin Dashboard Examples](#admin-dashboard-examples)
6. [Custom Role Logic](#custom-role-logic)
7. [Error Handling Patterns](#error-handling-patterns)

## Basic Authentication

### Using the useAuth Hook

```typescript
import { useAuth } from '../hooks/useAuth';

function UserProfile() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <p>Email: {user?.email}</p>
      <p>Roles: {user?.roles.join(', ')}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Login Form Implementation

```typescript
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      // Error is automatically handled by AuthContext
      console.log('Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

## Route Protection

### Basic Protected Route

```typescript
// In App.tsx
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes - requires authentication */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
```

### Role-Specific Routes

```typescript
function App() {
  return (
    <Routes>
      {/* Admin-only route */}
      <Route 
        path="/admin" 
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } 
      />
      
      {/* Moderator or Admin route */}
      <Route 
        path="/moderate" 
        element={
          <ProtectedRoute roles={['moderator', 'admin']}>
            <ModerationPanel />
          </ProtectedRoute>
        } 
      />
      
      {/* Premium feature route */}
      <Route 
        path="/premium-features" 
        element={
          <ProtectedRoute role="premium">
            <PremiumFeatures />
          </ProtectedRoute>
        } 
      />
      
      {/* Requires both admin AND premium roles */}
      <Route 
        path="/premium-admin" 
        element={
          <ProtectedRoute roles={['admin', 'premium']} requireAll={true}>
            <PremiumAdminPanel />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
```

## Component-Level Protection

### Using RoleGuard for Conditional Components

```typescript
import { RoleGuard } from '../components/RoleGuard';

function NavigationMenu() {
  return (
    <nav>
      <a href="/dashboard">Dashboard</a>
      
      {/* Only show admin link to admins */}
      <RoleGuard role="admin">
        <a href="/admin">Admin Panel</a>
      </RoleGuard>
      
      {/* Show moderation tools to moderators and admins */}
      <RoleGuard roles={['moderator', 'admin']}>
        <a href="/moderate">Moderation</a>
      </RoleGuard>
      
      {/* Premium features with fallback */}
      <RoleGuard 
        role="premium" 
        fallback={<a href="/upgrade">Upgrade to Premium</a>}
      >
        <a href="/premium-features">Premium Features</a>
      </RoleGuard>
    </nav>
  );
}
```

### Content Section Protection

```typescript
function UserDashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Basic content for all users */}
      <section>
        <h2>Your Activities</h2>
        <ActivityList />
      </section>
      
      {/* Admin-only section */}
      <RoleGuard role="admin">
        <section>
          <h2>Admin Tools</h2>
          <AdminToolbar />
        </section>
      </RoleGuard>
      
      {/* Premium content with upgrade prompt */}
      <RoleGuard 
        role="premium"
        fallback={
          <section className="upgrade-prompt">
            <h2>Premium Features</h2>
            <p>Upgrade to access advanced analytics and reports.</p>
            <button>Upgrade Now</button>
          </section>
        }
      >
        <section>
          <h2>Premium Analytics</h2>
          <AdvancedAnalytics />
        </section>
      </RoleGuard>
    </div>
  );
}
```

## Conditional Rendering

### Using Role Checking Methods

```typescript
function ToolbarActions() {
  const { hasRole, hasAnyRole, isAdmin } = useAuth();

  return (
    <div className="toolbar">
      {/* Always visible action */}
      <button>View</button>
      
      {/* Admin-only actions */}
      {isAdmin && (
        <>
          <button>Edit</button>
          <button>Delete</button>
        </>
      )}
      
      {/* Moderator or Admin actions */}
      {hasAnyRole(['moderator', 'admin']) && (
        <button>Moderate</button>
      )}
      
      {/* Premium feature button */}
      {hasRole('premium') ? (
        <button>Export Premium Report</button>
      ) : (
        <button disabled title="Requires Premium">
          Export Premium Report
        </button>
      )}
    </div>
  );
}
```

### Complex Role Logic

```typescript
function ProjectAccess() {
  const { user, hasRole, hasAllRoles } = useAuth();
  
  // Custom business logic
  const canEditProject = hasRole('admin') || 
    (hasRole('moderator') && user?.id === project.createdBy);
  
  const canDeleteProject = hasAllRoles(['admin', 'premium']);
  
  const hasAdvancedFeatures = hasRole('premium') || hasRole('admin');

  return (
    <div>
      <h2>Project: {project.name}</h2>
      
      {canEditProject && (
        <button onClick={handleEdit}>Edit Project</button>
      )}
      
      {canDeleteProject && (
        <button onClick={handleDelete} className="danger">
          Delete Project
        </button>
      )}
      
      {hasAdvancedFeatures && (
        <div className="advanced-tools">
          <h3>Advanced Tools</h3>
          <AdvancedProjectTools />
        </div>
      )}
    </div>
  );
}
```

## Admin Dashboard Examples

### User Management Component

Based on `src/pages/AdminDashboard.tsx`:

```typescript
function UserManagement() {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);

  // Available roles configuration
  const AVAILABLE_ROLES = ['user', 'admin', 'moderator', 'premium'];

  const loadUsers = async () => {
    try {
      const response = await adminService.getUsers(token!);
      setUsers(response.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleRoleToggle = (role: string) => {
    if (!editingUser) return;

    const newRoles = editingUser.roles.includes(role)
      ? editingUser.roles.filter(r => r !== role)
      : [...editingUser.roles, role];

    setEditingUser({
      ...editingUser,
      roles: newRoles,
    });
  };

  const handleSaveRoles = async () => {
    if (!editingUser || !token) return;

    try {
      const updatedUser = await adminService.updateUserRoles(
        token,
        editingUser.id,
        editingUser.roles
      );
      
      setUsers(users.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      ));
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to update user roles:', error);
    }
  };

  return (
    <div>
      <h2>User Management</h2>
      
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Roles</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                {user.roles.map((role) => (
                  <span key={role} className={`role-badge role-${role}`}>
                    {role}
                  </span>
                ))}
              </td>
              <td>
                <button onClick={() => setEditingUser({ 
                  id: user.id, 
                  roles: [...user.roles] 
                })}>
                  Edit Roles
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Role editing modal */}
      {editingUser && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit User Roles</h3>
            
            {AVAILABLE_ROLES.map((role) => (
              <label key={role}>
                <input
                  type="checkbox"
                  checked={editingUser.roles.includes(role)}
                  onChange={() => handleRoleToggle(role)}
                />
                {role}
              </label>
            ))}
            
            <div className="modal-actions">
              <button onClick={() => setEditingUser(null)}>Cancel</button>
              <button onClick={handleSaveRoles}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Role Badge Component

```typescript
interface RoleBadgeProps {
  role: string;
  size?: 'small' | 'medium' | 'large';
}

function RoleBadge({ role, size = 'medium' }: RoleBadgeProps) {
  const getColorClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'moderator':
        return 'bg-yellow-100 text-yellow-800';
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getSizeClass = (size: string) => {
    switch (size) {
      case 'small':
        return 'px-2 py-0.5 text-xs';
      case 'large':
        return 'px-3 py-1 text-sm';
      default:
        return 'px-2.5 py-0.5 text-xs';
    }
  };

  return (
    <span 
      className={`inline-flex items-center rounded-full font-medium ${getColorClass(role)} ${getSizeClass(size)}`}
    >
      {role}
    </span>
  );
}

// Usage in user lists
function UserCard({ user }: { user: UserManagement }) {
  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <div className="roles">
        {user.roles.map(role => (
          <RoleBadge key={role} role={role} size="small" />
        ))}
      </div>
    </div>
  );
}
```

## Custom Role Logic

### Business-Specific Role Combinations

```typescript
function useCustomPermissions() {
  const { user, hasRole, hasAnyRole, hasAllRoles } = useAuth();

  // Complex business logic
  const canManageContent = hasAnyRole(['admin', 'moderator']);
  
  const canAccessPremiumFeatures = hasRole('premium') || hasRole('admin');
  
  const canDeleteUsers = hasRole('admin');
  
  const canModerateComments = hasAnyRole(['admin', 'moderator']) && 
    user?.created_at && 
    new Date(user.created_at) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days old
    
  const isContentCreator = hasRole('user') && user?.roles.length === 1;
  
  const isSuperAdmin = hasAllRoles(['admin', 'premium']) && 
    user?.email?.endsWith('@company.com');

  return {
    canManageContent,
    canAccessPremiumFeatures,
    canDeleteUsers,
    canModerateComments,
    isContentCreator,
    isSuperAdmin,
  };
}

// Usage in components
function ContentManagementPanel() {
  const { 
    canManageContent, 
    canDeleteUsers, 
    isSuperAdmin 
  } = useCustomPermissions();

  if (!canManageContent) {
    return <div>Access denied. You don't have permission to manage content.</div>;
  }

  return (
    <div>
      <h2>Content Management</h2>
      
      <ContentList />
      
      {canDeleteUsers && (
        <section>
          <h3>User Management</h3>
          <UserManagementTools />
        </section>
      )}
      
      {isSuperAdmin && (
        <section>
          <h3>Super Admin Tools</h3>
          <SystemConfiguration />
        </section>
      )}
    </div>
  );
}
```

### Role-Based Feature Flags

```typescript
function useFeatureFlags() {
  const { hasRole, hasAnyRole } = useAuth();

  return {
    advancedAnalytics: hasRole('premium') || hasRole('admin'),
    bulkOperations: hasAnyRole(['admin', 'moderator']),
    exportFeatures: hasRole('premium'),
    apiAccess: hasAnyRole(['admin', 'premium']),
    customBranding: hasRole('premium'),
    prioritySupport: hasAnyRole(['premium', 'admin']),
  };
}

// Usage in feature components
function AnalyticsDashboard() {
  const { advancedAnalytics, exportFeatures } = useFeatureFlags();

  return (
    <div>
      <h2>Analytics</h2>
      
      {/* Basic analytics for everyone */}
      <BasicAnalytics />
      
      {/* Advanced analytics for premium/admin */}
      {advancedAnalytics && (
        <div>
          <h3>Advanced Analytics</h3>
          <AdvancedCharts />
          <PredictiveAnalytics />
        </div>
      )}
      
      {/* Export features */}
      {exportFeatures && (
        <div className="export-section">
          <h3>Export Options</h3>
          <ExportToolbar />
        </div>
      )}
    </div>
  );
}
```

## Error Handling Patterns

### Authentication Error Boundaries

```typescript
function AuthenticatedComponent() {
  const { isAuthenticated, error, clearError } = useAuth();
  
  if (error) {
    return (
      <div className="error-container">
        <h3>Authentication Error</h3>
        <p>{error}</p>
        <button onClick={clearError}>Dismiss</button>
        <button onClick={() => window.location.href = '/login'}>
          Go to Login
        </button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <div>Authenticated content...</div>;
}
```

### API Error Handling in Admin Operations

```typescript
function UserRoleManager({ userId }: { userId: string }) {
  const { token } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const updateUserRoles = async (roles: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      await adminService.updateUserRoles(token!, userId, roles);
      // Success handling...
    } catch (err) {
      if (err instanceof ApiError) {
        switch (err.status) {
          case 403:
            setError('You do not have permission to modify user roles.');
            break;
          case 404:
            setError('User not found.');
            break;
          case 500:
            setError('Server error. Please try again later.');
            break;
          default:
            setError(err.message);
        }
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      <RoleEditor 
        onSave={updateUserRoles}
        disabled={isLoading}
      />
    </div>
  );
}
```

### Graceful Permission Degradation

```typescript
function FeatureComponent() {
  const { hasRole, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return (
      <div className="feature-locked">
        <h3>Sign in to access this feature</h3>
        <button>Sign In</button>
      </div>
    );
  }
  
  if (!hasRole('premium')) {
    return (
      <div className="feature-limited">
        <h3>Premium Feature</h3>
        <p>Upgrade your account to access this feature.</p>
        <button>Upgrade to Premium</button>
      </div>
    );
  }
  
  return <PremiumFeatureContent />;
}
```

These examples demonstrate practical implementation patterns for the RBAC system, showing how to integrate authentication and authorization seamlessly into React components while maintaining good user experience and security practices.