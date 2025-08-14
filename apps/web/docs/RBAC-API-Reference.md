# RBAC API Reference

## Table of Contents
1. [Authentication Endpoints](#authentication-endpoints)
2. [Admin Management Endpoints](#admin-management-endpoints)
3. [Request/Response Types](#requestresponse-types)
4. [Error Handling](#error-handling)
5. [Authentication Headers](#authentication-headers)

## Base Configuration

```typescript
const API_BASE_URL = import.meta.env.VITE_API_HOST || 'http://localhost:8080/api/v1';
```

## Authentication Endpoints

### POST /auth/login

Authenticate a user and receive a JWT token.

**Endpoint**: `POST /api/v1/auth/login`

**Request Body**:
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

**Response**:
```typescript
interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    company: string | null;
    roles: string[];
    created_at: string;
    updated_at: string;
  };
}
```

**Example**:
```typescript
const response = await authService.login({
  email: "user@example.com",
  password: "password123"
});
```

**Implementation**: `src/services/auth.service.ts:52-82`

### POST /auth/register

Register a new user account.

**Endpoint**: `POST /api/v1/auth/register`

**Request Body**:
```typescript
interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}
```

**Response**: Same as login response (`LoginResponse`)

**Example**:
```typescript
const response = await authService.register({
  name: "John Doe",
  email: "john@example.com",
  password: "password123"
});
```

**Implementation**: `src/services/auth.service.ts:84-118`

### POST /auth/forgot-password

Request a password reset email.

**Endpoint**: `POST /api/v1/auth/forgot-password`

**Request Body**:
```typescript
interface ForgotPasswordRequest {
  email: string;
}
```

**Response**:
```typescript
interface ForgotPasswordResponse {
  message: string;
}
```

**Example**:
```typescript
const response = await authService.requestPasswordReset("user@example.com");
```

**Implementation**: `src/services/auth.service.ts:162-192`

### POST /auth/reset-password

Reset password using a reset token.

**Endpoint**: `POST /api/v1/auth/reset-password`

**Request Body**:
```typescript
interface ResetPasswordRequest {
  token: string;
  password: string;
}
```

**Response**: Same as forgot password response (`ForgotPasswordResponse`)

**Example**:
```typescript
const response = await authService.resetPassword("reset-token", "newpassword123");
```

**Implementation**: `src/services/auth.service.ts:194-224`

## Admin Management Endpoints

All admin endpoints require authentication with admin role.

### GET /admin/users

Retrieve a list of all users in the system.

**Endpoint**: `GET /api/v1/admin/users`

**Headers**:
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Response**:
```typescript
interface UsersListResponse {
  users: UserManagement[];
  total: number;
}

interface UserManagement {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  company: string | null;
  roles: string[];
  created_at: string;
  updated_at: string;
}
```

**Example**:
```typescript
const response = await adminService.getUsers(token);
console.log(`Total users: ${response.total}`);
```

**Implementation**: `src/services/admin.service.ts:27-57`

### PUT /admin/users/:userId/roles

Update roles for a specific user.

**Endpoint**: `PUT /api/v1/admin/users/{userId}/roles`

**Headers**:
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body**:
```typescript
interface UpdateRolesRequest {
  roles: string[];
}
```

**Response**: Updated user object (`UserManagement`)

**Example**:
```typescript
const updatedUser = await adminService.updateUserRoles(
  token,
  "user-id-123",
  ["user", "premium"]
);
```

**Implementation**: `src/services/admin.service.ts:59-90`

### DELETE /admin/users/:userId

Delete a user from the system.

**Endpoint**: `DELETE /api/v1/admin/users/{userId}`

**Headers**:
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Response**:
```typescript
{
  message: string;
}
```

**Example**:
```typescript
const response = await adminService.deleteUser(token, "user-id-123");
console.log(response.message); // "User deleted successfully"
```

**Implementation**: `src/services/admin.service.ts:92-122`

## Request/Response Types

### Core Authentication Types

```typescript
// Login request payload
interface LoginRequest {
  email: string;
  password: string;
}

// Registration request payload
interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// Password reset request
interface ForgotPasswordRequest {
  email: string;
}

// Password reset with token
interface ResetPasswordRequest {
  token: string;
  password: string;
}

// Standard user response structure
interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    company: string | null;
    roles: string[];
    created_at: string;
    updated_at: string;
  };
}

// Password reset response
interface ForgotPasswordResponse {
  message: string;
}
```

### Admin Management Types

```typescript
// User management structure
interface UserManagement {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  company: string | null;
  roles: string[];
  created_at: string;
  updated_at: string;
}

// Users list response
interface UsersListResponse {
  users: UserManagement[];
  total: number;
}

// Role update request
interface UpdateRolesRequest {
  roles: string[];
}
```

## Error Handling

### ApiError Class

```typescript
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
```

### Error Response Structure

All API endpoints follow a consistent error response format:

```typescript
{
  error?: string;     // Error message
  message?: string;   // Alternative error message
}
```

### Common Error Scenarios

#### Authentication Errors
- **401 Unauthorized**: Invalid or expired token
- **403 Forbidden**: Insufficient permissions
- **400 Bad Request**: Invalid credentials

#### Network Errors
- **0 Network Error**: Connection issues, server unavailable

#### Validation Errors
- **400 Bad Request**: Invalid input data
- **422 Unprocessable Entity**: Validation failures

### Error Handling Implementation

```typescript
try {
  const response = await fetch(endpoint, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.error || errorData.message || 'Operation failed',
      response.status
    );
  }

  return await response.json();
} catch (error) {
  if (error instanceof ApiError) {
    throw error;
  }
  
  throw new ApiError(
    'Network error. Please check your connection.',
    0
  );
}
```

## Authentication Headers

### Bearer Token Format

All protected endpoints require authentication via Bearer token:

```typescript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
};
```

### Token Validation

Client-side token validation is performed before API calls:

```typescript
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
```

**Implementation**: `src/services/auth.service.ts:148-160`

## Available Roles

The system supports the following predefined roles:

```typescript
const AVAILABLE_ROLES = ['user', 'admin', 'moderator', 'premium'];
```

### Role Hierarchy

- **user**: Default role, basic access
- **moderator**: Content moderation capabilities
- **premium**: Enhanced feature access
- **admin**: Full system access, user management

## Token Storage

### LocalStorage Management

```typescript
// Store authentication token
storeToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

// Retrieve stored token
getStoredToken(): string | null {
  return localStorage.getItem('auth_token');
}

// Store user data
storeUser(user: LoginResponse['user']): void {
  localStorage.setItem('user_data', JSON.stringify(user));
}

// Retrieve stored user data
getStoredUser(): LoginResponse['user'] | null {
  const userData = localStorage.getItem('user_data');
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
}

// Clean up stored data
removeToken(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
}
```

**Implementation**: `src/services/auth.service.ts:120-146`

## Rate Limiting and Security

### Security Best Practices

1. **Always validate tokens server-side** before processing requests
2. **Use HTTPS** for all authentication endpoints
3. **Implement rate limiting** on authentication endpoints
4. **Sanitize input data** to prevent injection attacks
5. **Log authentication attempts** for security monitoring

### Client-Side Security

1. **Store tokens securely** (consider httpOnly cookies for production)
2. **Validate token expiration** before API calls
3. **Clear tokens on logout** or expiration
4. **Never log sensitive information** in console or error messages

## Usage Examples

See [RBAC-Usage-Examples.md](./RBAC-Usage-Examples.md) for detailed implementation examples of these API endpoints in React components.