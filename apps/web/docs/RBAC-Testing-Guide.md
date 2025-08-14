# RBAC Testing Guide

## Table of Contents
1. [Testing Strategy](#testing-strategy)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [Manual Testing Scenarios](#manual-testing-scenarios)
6. [Mock Data and Test Users](#mock-data-and-test-users)
7. [Security Testing](#security-testing)

## Testing Strategy

### Testing Pyramid for RBAC

```
    /\
   /  \     E2E Tests (Few)
  /____\    - User flows with different roles
 /      \   - Authentication workflows
/__________\ - Admin dashboard operations

    Integration Tests (Some)
    - Component + Context interactions
    - API service layer testing
    - Route protection testing

Unit Tests (Many)
- Role checking utilities
- Authentication helpers
- Component rendering logic
```

### Key Testing Areas

1. **Authentication Flow**: Login, logout, token management
2. **Authorization Logic**: Role checking functions
3. **Route Protection**: Access control for different user types
4. **Component Rendering**: Conditional content based on roles
5. **API Integration**: Service layer authentication
6. **Error Handling**: Invalid tokens, network errors, permission denied

## Unit Testing

### Testing Authentication Context

```typescript
// __tests__/contexts/AuthContext.test.tsx
import { render, renderHook, act } from '@testing-library/react';
import { AuthProvider } from '../../src/contexts/AuthContext';
import { useAuth } from '../../src/hooks/useAuth';

// Mock the auth service
jest.mock('../../src/services/auth.service', () => ({
  authService: {
    getStoredToken: jest.fn(),
    getStoredUser: jest.fn(),
    isAuthenticated: jest.fn(),
    storeToken: jest.fn(),
    storeUser: jest.fn(),
    removeToken: jest.fn(),
    login: jest.fn(),
  },
}));

describe('AuthContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Role checking functions', () => {
    it('should correctly identify user roles', () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['user', 'premium'],
        phone: null,
        company: null,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Set user state
      act(() => {
        result.current.setUser?.(mockUser);
      });

      expect(result.current.hasRole('user')).toBe(true);
      expect(result.current.hasRole('premium')).toBe(true);
      expect(result.current.hasRole('admin')).toBe(false);
    });

    it('should handle hasAnyRole correctly', () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['user', 'moderator'],
        phone: null,
        company: null,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.setUser?.(mockUser);
      });

      expect(result.current.hasAnyRole(['admin', 'moderator'])).toBe(true);
      expect(result.current.hasAnyRole(['admin', 'premium'])).toBe(false);
    });

    it('should handle hasAllRoles correctly', () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['user', 'admin', 'premium'],
        phone: null,
        company: null,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.setUser?.(mockUser);
      });

      expect(result.current.hasAllRoles(['user', 'admin'])).toBe(true);
      expect(result.current.hasAllRoles(['user', 'admin', 'moderator'])).toBe(false);
    });

    it('should return false for role checks when user is null', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.hasRole('user')).toBe(false);
      expect(result.current.hasAnyRole(['user', 'admin'])).toBe(false);
      expect(result.current.hasAllRoles(['user'])).toBe(false);
      expect(result.current.isAdmin).toBe(false);
    });
  });

  describe('Authentication state', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.isLoading).toBe(true);
    });

    it('should set authenticated state when user and token exist', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.setToken?.('mock-token');
        result.current.setUser?.({
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          roles: ['user'],
          phone: null,
          company: null,
          created_at: '2023-01-01',
          updated_at: '2023-01-01',
        });
      });

      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
```

### Testing Route Guards

```typescript
// __tests__/components/ProtectedRoute.test.tsx
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { AuthContext } from '../../src/contexts/auth-context';

const mockAuthContext = {
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  login: jest.fn(),
  register: jest.fn(),
  updateProfile: jest.fn(),
  logout: jest.fn(),
  error: null,
  clearError: jest.fn(),
  hasRole: jest.fn(),
  hasAnyRole: jest.fn(),
  hasAllRoles: jest.fn(),
  isAdmin: false,
};

const Wrapper = ({ children, authValue = mockAuthContext }: any) => (
  <BrowserRouter>
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  </BrowserRouter>
);

describe('ProtectedRoute', () => {
  it('shows loading spinner when authentication is loading', () => {
    const authValue = { ...mockAuthContext, isLoading: true };
    
    render(
      <Wrapper authValue={authValue}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </Wrapper>
    );

    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  it('redirects to login when not authenticated', () => {
    render(
      <Wrapper>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </Wrapper>
    );

    // Check if redirect happened (you might need to spy on navigate)
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    const authValue = {
      ...mockAuthContext,
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com', roles: ['user'] },
    };

    render(
      <Wrapper authValue={authValue}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </Wrapper>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('checks specific role requirements', () => {
    const authValue = {
      ...mockAuthContext,
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com', roles: ['user'] },
      hasRole: jest.fn((role) => role === 'user'),
    };

    render(
      <Wrapper authValue={authValue}>
        <ProtectedRoute role="admin">
          <div>Admin Content</div>
        </ProtectedRoute>
      </Wrapper>
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    expect(authValue.hasRole).toHaveBeenCalledWith('admin');
  });

  it('allows access when user has required role', () => {
    const authValue = {
      ...mockAuthContext,
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com', roles: ['admin'] },
      hasRole: jest.fn((role) => role === 'admin'),
    };

    render(
      <Wrapper authValue={authValue}>
        <ProtectedRoute role="admin">
          <div>Admin Content</div>
        </ProtectedRoute>
      </Wrapper>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });
});
```

### Testing RoleGuard Component

```typescript
// __tests__/components/RoleGuard.test.tsx
import { render, screen } from '@testing-library/react';
import { RoleGuard } from '../../src/components/RoleGuard';
import { AuthContext } from '../../src/contexts/auth-context';

describe('RoleGuard', () => {
  const mockAuthContext = {
    hasRole: jest.fn(),
    hasAnyRole: jest.fn(),
    hasAllRoles: jest.fn(),
    // ... other context properties
  };

  const Wrapper = ({ children, authValue = mockAuthContext }: any) => (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when user has required role', () => {
    mockAuthContext.hasRole.mockReturnValue(true);

    render(
      <Wrapper>
        <RoleGuard role="admin">
          <div>Admin Content</div>
        </RoleGuard>
      </Wrapper>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
    expect(mockAuthContext.hasRole).toHaveBeenCalledWith('admin');
  });

  it('renders fallback when user lacks required role', () => {
    mockAuthContext.hasRole.mockReturnValue(false);

    render(
      <Wrapper>
        <RoleGuard role="admin" fallback={<div>Access Denied</div>}>
          <div>Admin Content</div>
        </RoleGuard>
      </Wrapper>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('works with multiple roles using hasAnyRole', () => {
    mockAuthContext.hasAnyRole.mockReturnValue(true);

    render(
      <Wrapper>
        <RoleGuard roles={['admin', 'moderator']}>
          <div>Moderation Content</div>
        </RoleGuard>
      </Wrapper>
    );

    expect(screen.getByText('Moderation Content')).toBeInTheDocument();
    expect(mockAuthContext.hasAnyRole).toHaveBeenCalledWith(['admin', 'moderator']);
  });

  it('works with requireAll flag using hasAllRoles', () => {
    mockAuthContext.hasAllRoles.mockReturnValue(true);

    render(
      <Wrapper>
        <RoleGuard roles={['admin', 'premium']} requireAll={true}>
          <div>Premium Admin Content</div>
        </RoleGuard>
      </Wrapper>
    );

    expect(screen.getByText('Premium Admin Content')).toBeInTheDocument();
    expect(mockAuthContext.hasAllRoles).toHaveBeenCalledWith(['admin', 'premium']);
  });
});
```

## Integration Testing

### Testing Authentication Flow

```typescript
// __tests__/integration/authFlow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '../../src/App';
import { authService } from '../../src/services/auth.service';

// Mock the auth service
jest.mock('../../src/services/auth.service');

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('completes full login flow', async () => {
    const user = userEvent.setup();
    const mockLoginResponse = {
      token: 'mock-jwt-token',
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['user'],
        phone: null,
        company: null,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      },
    };

    (authService.login as jest.Mock).mockResolvedValue(mockLoginResponse);
    (authService.getStoredToken as jest.Mock).mockReturnValue(null);
    (authService.isAuthenticated as jest.Mock).mockReturnValue(false);

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Navigate to login
    const loginLink = screen.getByText('Login');
    await user.click(loginLink);

    // Fill in login form
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Wait for authentication to complete
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // Check if redirected to dashboard
    await waitFor(() => {
      expect(screen.getByText('Welcome, Test User')).toBeInTheDocument();
    });
  });

  it('handles login errors appropriately', async () => {
    const user = userEvent.setup();
    (authService.login as jest.Mock).mockRejectedValue(
      new Error('Invalid credentials')
    );

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Navigate to login and submit invalid credentials
    const loginLink = screen.getByText('Login');
    await user.click(loginLink);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'invalid@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
```

### Testing Admin Operations

```typescript
// __tests__/integration/adminOperations.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminDashboard } from '../../src/pages/AdminDashboard';
import { adminService } from '../../src/services/admin.service';
import { AuthContext } from '../../src/contexts/auth-context';

jest.mock('../../src/services/admin.service');

describe('Admin Operations Integration', () => {
  const mockAdminUser = {
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'Admin User',
    roles: ['admin'],
    phone: null,
    company: null,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  };

  const mockAuthContext = {
    user: mockAdminUser,
    token: 'admin-token',
    isAuthenticated: true,
    isAdmin: true,
    hasRole: (role: string) => mockAdminUser.roles.includes(role),
    // ... other context properties
  };

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthContext.Provider value={mockAuthContext}>
      {children}
    </AuthContext.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and displays user list', async () => {
    const mockUsers = [
      {
        id: '1',
        email: 'user1@example.com',
        name: 'User One',
        roles: ['user'],
        phone: null,
        company: null,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      },
      {
        id: '2',
        email: 'user2@example.com',
        name: 'User Two',
        roles: ['user', 'premium'],
        phone: null,
        company: null,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      },
    ];

    (adminService.getUsers as jest.Mock).mockResolvedValue({
      users: mockUsers,
      total: 2,
    });

    render(
      <Wrapper>
        <AdminDashboard />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('User One')).toBeInTheDocument();
      expect(screen.getByText('User Two')).toBeInTheDocument();
      expect(screen.getByText('Total users: 2')).toBeInTheDocument();
    });
  });

  it('updates user roles successfully', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: '1',
      email: 'user1@example.com',
      name: 'User One',
      roles: ['user'],
      phone: null,
      company: null,
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    };

    (adminService.getUsers as jest.Mock).mockResolvedValue({
      users: [mockUser],
      total: 1,
    });

    (adminService.updateUserRoles as jest.Mock).mockResolvedValue({
      ...mockUser,
      roles: ['user', 'premium'],
    });

    render(
      <Wrapper>
        <AdminDashboard />
      </Wrapper>
    );

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('User One')).toBeInTheDocument();
    });

    // Click edit roles button
    const editButton = screen.getByText('Edit Roles');
    await user.click(editButton);

    // Check premium role checkbox
    const premiumCheckbox = screen.getByLabelText('premium');
    await user.click(premiumCheckbox);

    // Save changes
    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    // Verify API was called correctly
    await waitFor(() => {
      expect(adminService.updateUserRoles).toHaveBeenCalledWith(
        'admin-token',
        '1',
        ['user', 'premium']
      );
    });
  });
});
```

## End-to-End Testing

### E2E Test Setup (Using Playwright or Cypress)

```typescript
// e2e/auth.spec.ts (Playwright example)
import { test, expect } from '@playwright/test';

test.describe('RBAC Authentication E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('user can login and access dashboard', async ({ page }) => {
    // Navigate to login
    await page.click('text=Login');
    
    // Fill login form
    await page.fill('[placeholder="Email"]', 'user@example.com');
    await page.fill('[placeholder="Password"]', 'password123');
    await page.click('button:has-text("Login")');
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Welcome');
  });

  test('admin can access admin dashboard', async ({ page }) => {
    // Login as admin
    await page.click('text=Login');
    await page.fill('[placeholder="Email"]', 'admin@example.com');
    await page.fill('[placeholder="Password"]', 'adminpass123');
    await page.click('button:has-text("Login")');
    
    // Navigate to admin
    await page.goto('/admin');
    
    // Verify admin dashboard loads
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    await expect(page.locator('table')).toBeVisible();
  });

  test('regular user cannot access admin dashboard', async ({ page }) => {
    // Login as regular user
    await page.click('text=Login');
    await page.fill('[placeholder="Email"]', 'user@example.com');
    await page.fill('[placeholder="Password"]', 'password123');
    await page.click('button:has-text("Login")');
    
    // Try to access admin
    await page.goto('/admin');
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should be redirected to login
    await expect(page).toHaveURL('/login');
  });
});
```

### E2E Role Management Tests

```typescript
// e2e/adminRoleManagement.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Admin Role Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[placeholder="Email"]', 'admin@example.com');
    await page.fill('[placeholder="Password"]', 'adminpass123');
    await page.click('button:has-text("Login")');
    await page.goto('/admin');
  });

  test('admin can update user roles', async ({ page }) => {
    // Find a user row
    const userRow = page.locator('tr:has-text("test@example.com")');
    await expect(userRow).toBeVisible();
    
    // Click edit roles
    await userRow.locator('button:has-text("Edit Roles")').click();
    
    // Check premium role
    await page.check('input[type="checkbox"]:near(:text("premium"))');
    
    // Save changes
    await page.click('button:has-text("Save Changes")');
    
    // Verify role was added
    await expect(userRow.locator('.role-badge:has-text("premium")')).toBeVisible();
  });

  test('admin can delete users', async ({ page }) => {
    const initialUserCount = await page.locator('tbody tr').count();
    
    // Find a user row and click delete
    const userRow = page.locator('tr:has-text("deleteme@example.com")').first();
    await userRow.locator('button:has-text("Delete")').click();
    
    // Confirm deletion
    await page.click('button:has-text("Delete User")');
    
    // Verify user count decreased
    await expect(page.locator('tbody tr')).toHaveCount(initialUserCount - 1);
  });
});
```

## Manual Testing Scenarios

### Authentication Test Cases

#### Login Scenarios
1. **Valid Credentials**
   - Input: Correct email and password
   - Expected: Successful login, redirect to dashboard
   - Test with: user@example.com / password123

2. **Invalid Credentials**
   - Input: Wrong email or password
   - Expected: Error message displayed
   - Test with: invalid@example.com / wrongpass

3. **Empty Fields**
   - Input: Leave email or password empty
   - Expected: Validation error
   - Test with: "" / ""

4. **Network Error**
   - Setup: Disconnect network during login
   - Expected: Network error message
   - Test: Offline mode

#### Role-Based Access Tests

1. **Admin Access**
   - Login: admin@example.com
   - Test Routes: /admin, /dashboard, /profile
   - Expected: Access to all routes

2. **Regular User Access**
   - Login: user@example.com
   - Test Routes: /admin (should redirect), /dashboard (accessible)
   - Expected: Limited access

3. **Premium User Features**
   - Login: premium@example.com
   - Test: Premium-only components visible
   - Expected: Enhanced features available

### Component Visibility Tests

#### Navigation Menu
- **Unauthenticated**: Only Login, Register visible
- **User**: Dashboard, Profile, Logout visible
- **Admin**: Additional Admin link visible
- **Premium**: Premium features link visible

#### Dashboard Content
- **All Users**: Basic dashboard content
- **Premium**: Advanced analytics section
- **Admin**: User management tools
- **Moderator**: Content moderation tools

### Error Handling Tests

1. **Expired Token**
   - Setup: Manually expire token in localStorage
   - Action: Refresh page or navigate
   - Expected: Redirect to login

2. **Invalid Token**
   - Setup: Corrupt token in localStorage
   - Action: Access protected route
   - Expected: Authentication cleared, redirect to login

3. **API Errors**
   - Setup: Mock 500 server errors
   - Action: Perform admin operations
   - Expected: Graceful error messages

## Mock Data and Test Users

### Test User Accounts

```typescript
// test-data/users.ts
export const testUsers = {
  admin: {
    email: 'admin@example.com',
    password: 'admin123',
    expectedRoles: ['admin', 'user'],
    accessibleRoutes: ['/dashboard', '/admin', '/profile'],
    restrictedRoutes: [],
  },
  
  user: {
    email: 'user@example.com',
    password: 'user123',
    expectedRoles: ['user'],
    accessibleRoutes: ['/dashboard', '/profile'],
    restrictedRoutes: ['/admin'],
  },
  
  premium: {
    email: 'premium@example.com',
    password: 'premium123',
    expectedRoles: ['user', 'premium'],
    accessibleRoutes: ['/dashboard', '/profile', '/premium-features'],
    restrictedRoutes: ['/admin'],
  },
  
  moderator: {
    email: 'moderator@example.com',
    password: 'mod123',
    expectedRoles: ['user', 'moderator'],
    accessibleRoutes: ['/dashboard', '/profile', '/moderate'],
    restrictedRoutes: ['/admin'],
  },
};
```

### Mock API Responses

```typescript
// test-utils/mockResponses.ts
export const mockAuthResponses = {
  loginSuccess: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user'],
      phone: null,
      company: null,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
  },
  
  loginError: {
    error: 'Invalid email or password',
  },
  
  usersList: {
    users: [
      {
        id: '1',
        email: 'user1@example.com',
        name: 'User One',
        roles: ['user'],
        phone: '555-0001',
        company: 'Company A',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
      {
        id: '2',
        email: 'user2@example.com',
        name: 'User Two',
        roles: ['user', 'premium'],
        phone: null,
        company: null,
        created_at: '2023-01-02T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
      },
    ],
    total: 2,
  },
};
```

### Test Utilities

```typescript
// test-utils/authTestUtils.ts
import { AuthContextType } from '../src/contexts/auth-context';

export const createMockAuthContext = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  login: jest.fn(),
  register: jest.fn(),
  updateProfile: jest.fn(),
  logout: jest.fn(),
  error: null,
  clearError: jest.fn(),
  hasRole: jest.fn(() => false),
  hasAnyRole: jest.fn(() => false),
  hasAllRoles: jest.fn(() => false),
  isAdmin: false,
  ...overrides,
});

export const createMockUser = (roles: string[] = ['user']) => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  roles,
  phone: null,
  company: null,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
});

export const loginAs = (role: string) => {
  const roles = role === 'admin' ? ['admin', 'user'] : [role, 'user'];
  return createMockAuthContext({
    isAuthenticated: true,
    user: createMockUser(roles),
    token: 'mock-token',
    hasRole: jest.fn((r) => roles.includes(r)),
    hasAnyRole: jest.fn((rs) => rs.some(r => roles.includes(r))),
    hasAllRoles: jest.fn((rs) => rs.every(r => roles.includes(r))),
    isAdmin: roles.includes('admin'),
  });
};
```

## Security Testing

### Token Security Tests

1. **Token Expiration Handling**
   ```typescript
   test('handles expired tokens correctly', () => {
     const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDk0NTkyMDB9.signature';
     expect(authService.isTokenExpired(expiredToken)).toBe(true);
   });
   ```

2. **Token Validation**
   ```typescript
   test('validates token format', () => {
     expect(authService.isTokenExpired('invalid-token')).toBe(true);
     expect(authService.isTokenExpired('')).toBe(true);
     expect(authService.isTokenExpired(null)).toBe(true);
   });
   ```

### Authorization Security Tests

1. **Role Escalation Prevention**
   - Test: Regular user attempting admin actions
   - Expected: Access denied

2. **Client-Side Bypass Attempts**
   - Test: Manually modifying localStorage roles
   - Expected: Server-side validation prevents access

3. **Token Hijacking Simulation**
   - Test: Using another user's token
   - Expected: Proper user identification

### Penetration Testing Checklist

- [ ] SQL injection in login forms
- [ ] XSS in user input fields
- [ ] CSRF token validation
- [ ] Session fixation attempts
- [ ] Password brute force protection
- [ ] Role privilege escalation
- [ ] API endpoint authorization
- [ ] Token storage security

### Security Test Automation

```typescript
// security/roleEscalation.test.ts
describe('Security: Role Escalation Prevention', () => {
  it('prevents client-side role modification', async () => {
    // Login as regular user
    await loginAs('user');
    
    // Attempt to modify roles in localStorage
    localStorage.setItem('user_data', JSON.stringify({
      ...JSON.parse(localStorage.getItem('user_data')),
      roles: ['admin']
    }));
    
    // Attempt admin action
    const response = await adminService.getUsers('user-token');
    
    // Should fail with 403
    expect(response).toBeInstanceOf(ApiError);
    expect(response.status).toBe(403);
  });
});
```

This comprehensive testing guide ensures robust validation of the RBAC system across all layers, from unit tests to security verification.