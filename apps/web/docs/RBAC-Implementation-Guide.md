# RBAC Implementation Guide

## Table of Contents
1. [Core Components](#core-components)
2. [Authentication Context](#authentication-context)
3. [Route Guards](#route-guards)
4. [Role Checking Utilities](#role-checking-utilities)
5. [Services Layer](#services-layer)
6. [Admin Management](#admin-management)

## Core Components

### AuthContext Provider Setup

The `AuthContext` is the foundation of the RBAC system. It provides authentication state and role checking utilities to the entire application.

**File**: `src/contexts/AuthContext.tsx:14-169`

```typescript
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<LoginResponse['user'] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Role checking methods
  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) ?? false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user?.roles) return false;
    return roles.some(role => user.roles.includes(role));
  };

  const hasAllRoles = (roles: string[]): boolean => {
    if (!user?.roles) return false;
    return roles.every(role => user.roles.includes(role));
  };
}
```

### AuthContext Type Definition

**File**: `src/contexts/auth-context.ts:5-20`

The `AuthContextType` interface defines all available authentication and role-checking methods:

```typescript
export interface AuthContextType {
  user: LoginResponse['user'] | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  updateProfile: (profileData: ProfileUpdateRequest) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  isAdmin: boolean;
}
```

## Authentication Context

### Initialization and Token Management

**File**: `src/contexts/AuthContext.tsx:20-36`

The context automatically initializes from stored tokens and validates authentication state:

```typescript
useEffect(() => {
  const initializeAuth = () => {
    const storedToken = authService.getStoredToken();
    const storedUser = authService.getStoredUser();

    if (storedToken && authService.isAuthenticated()) {
      setToken(storedToken);
      setUser(storedUser);
    } else {
      authService.removeToken();
    }

    setIsLoading(false);
  };

  initializeAuth();
}, []);
```

### Login Process with Profile Fetching

**File**: `src/contexts/AuthContext.tsx:38-64`

The login process includes automatic profile fetching to ensure complete user data:

```typescript
const login = async (credentials: LoginRequest) => {
  try {
    setIsLoading(true);
    setError(null);

    const response = await authService.login(credentials);
    
    // Fetch full profile after successful login
    const profile = await profileService.getProfile(response.token);
    
    // Store token and full profile data
    authService.storeToken(response.token);
    authService.storeUser(profile);
    
    setToken(response.token);
    setUser(profile);
  } catch (err) {
    // Error handling...
  }
};
```

## Route Guards

### ProtectedRoute Component

**File**: `src/components/ProtectedRoute.tsx:11-42`

The `ProtectedRoute` component provides flexible authentication and role-based access control:

```typescript
export const ProtectedRoute = ({ 
  children, 
  role, 
  roles, 
  requireAll = false 
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, hasRole, hasAnyRole, hasAllRoles } = useAuth();
  const location = useLocation();

  // Loading state
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>;
  }

  // Authentication check
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based access control
  if (role || roles) {
    let hasAccess = false;

    if (role) {
      hasAccess = hasRole(role);
    } else if (roles) {
      hasAccess = requireAll ? hasAllRoles(roles) : hasAnyRole(roles);
    }

    if (!hasAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
```

### AdminRoute Component

**File**: `src/components/AdminRoute.tsx:9-28`

Specialized route guard for admin-only pages:

```typescript
export function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
```

### RoleGuard Component

**File**: `src/components/RoleGuard.tsx:12-29`

Component-level role protection with fallback support:

```typescript
export function RoleGuard({ 
  children, 
  role, 
  roles, 
  requireAll = false, 
  fallback = null 
}: RoleGuardProps) {
  const { hasRole, hasAnyRole, hasAllRoles } = useAuth();

  let hasAccess = false;

  if (role) {
    hasAccess = hasRole(role);
  } else if (roles) {
    hasAccess = requireAll ? hasAllRoles(roles) : hasAnyRole(roles);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
```

## Role Checking Utilities

### useAuth Hook

**File**: `src/hooks/useAuth.ts`

The `useAuth` hook provides convenient access to authentication state and utilities:

```typescript
import { useContext } from 'react';
import { AuthContext } from '../contexts/auth-context';

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Role Checking Methods

The AuthContext provides three primary role checking methods:

#### hasRole(role: string)
Checks if the user has a specific role:
```typescript
const { hasRole } = useAuth();
const canAccessAdmin = hasRole('admin');
```

#### hasAnyRole(roles: string[])
Checks if the user has any of the specified roles:
```typescript
const { hasAnyRole } = useAuth();
const canModerate = hasAnyRole(['admin', 'moderator']);
```

#### hasAllRoles(roles: string[])
Checks if the user has all specified roles:
```typescript
const { hasAllRoles } = useAuth();
const hasPremiumAdmin = hasAllRoles(['admin', 'premium']);
```

## Services Layer

### Authentication Service

**File**: `src/services/auth.service.ts`

#### Token Management

```typescript
class AuthService {
  getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  storeToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  removeToken(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    return token !== null && !this.isTokenExpired(token);
  }
}
```

#### API Integration

**File**: `src/services/auth.service.ts:52-82`

```typescript
async login(credentials: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || errorData.message || 'Login failed',
        response.status
      );
    }

    const data: LoginResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      'Network error. Please check your connection.',
      0
    );
  }
}
```

### Admin Service

**File**: `src/services/admin.service.ts`

#### User Management

```typescript
class AdminService {
  async getUsers(token: string): Promise<UsersListResponse> {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    // Error handling and response processing...
  }

  async updateUserRoles(token: string, userId: string, roles: string[]): Promise<UserManagement> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/roles`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roles }),
    });
    // Error handling and response processing...
  }
}
```

## Admin Management

### Admin Dashboard Implementation

**File**: `src/pages/AdminDashboard.tsx`

The admin dashboard provides comprehensive user and role management:

#### Available Roles Configuration

```typescript
const AVAILABLE_ROLES = ['user', 'admin', 'moderator', 'premium'];
```

#### Role Management Interface

```typescript
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
    showSuccess('Roles Updated', 'User roles have been successfully updated.');
  } catch (err) {
    // Error handling...
  }
};
```

## Integration with React Router

**File**: `src/App.tsx:33-56`

Routes are protected using the implemented guard components:

```typescript
<Routes>
  <Route path="/dashboard" element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } />
  
  <Route path="/profile/edit" element={
    <ProtectedRoute>
      <ProfileEditPage />
    </ProtectedRoute>
  } />
  
  <Route path="/admin" element={
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  } />
</Routes>
```

## Best Practices

1. **Always check authentication first** before checking roles
2. **Provide loading states** during authentication checks
3. **Handle unauthorized access gracefully** with appropriate redirects
4. **Use the most specific guard** for your use case (AdminRoute vs ProtectedRoute)
5. **Combine server-side validation** with client-side role checks
6. **Store sensitive operations** behind admin-only endpoints
7. **Implement proper error handling** for all authentication operations

## Error Handling

The system includes comprehensive error handling:

- **ApiError class** for structured error responses
- **Network error fallbacks** for connectivity issues
- **Token expiration handling** with automatic cleanup
- **User feedback** through toast notifications
- **Graceful degradation** for unauthorized access