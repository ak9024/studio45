import { ApiError } from './auth.service';
export { ApiError };

export interface UserManagement {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  company: string | null;
  roles: string[];
  created_at: string;
  updated_at: string;
}

export interface UsersListResponse {
  users: UserManagement[];
  total: number;
}

export interface UpdateRolesRequest {
  roles: string[];
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string | null;
  company?: string | null;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
}

export interface RolesResponse {
  roles: Role[];
}

export interface UserPermission {
  permission: string;
  source: string; // role name or direct assignment
  inherited: boolean;
}

export interface UserPermissionsResponse {
  permissions: UserPermission[];
}

export interface PermissionCheckResponse {
  hasPermission: boolean;
  source?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_HOST || 'http://localhost:8080/api/v1';

class AdminService {
  async getUsers(token: string): Promise<UsersListResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || errorData.message || 'Failed to fetch users',
          response.status
        );
      }

      const data: UsersListResponse = await response.json();
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

  async updateUserRoles(token: string, userId: string, roles: string[]): Promise<UserManagement> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/roles`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roles }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || errorData.message || 'Failed to update user roles',
          response.status
        );
      }

      const data: UserManagement = await response.json();
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

  async deleteUser(token: string, userId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || errorData.message || 'Failed to delete user',
          response.status
        );
      }

      const data: { message: string } = await response.json();
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

  async getAllRoles(token: string): Promise<RolesResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/roles`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || errorData.message || 'Failed to fetch roles',
          response.status
        );
      }

      const data: RolesResponse = await response.json();
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

  async getUserPermissions(token: string, userId: string): Promise<UserPermissionsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/permissions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || errorData.message || 'Failed to fetch user permissions',
          response.status
        );
      }

      const data: UserPermissionsResponse = await response.json();
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

  async checkUserPermission(token: string, userId: string, permission: string): Promise<PermissionCheckResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/permissions/${permission}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || errorData.message || 'Failed to check user permission',
          response.status
        );
      }

      const data: PermissionCheckResponse = await response.json();
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

  async updateUserProfile(token: string, userId: string, userData: UpdateUserRequest): Promise<UserManagement> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || errorData.message || 'Failed to update user profile',
          response.status
        );
      }

      const data: UserManagement = await response.json();
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

  async bulkDeleteUsers(token: string, userIds: string[]): Promise<{ message: string; deletedCount: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/bulk-delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || errorData.message || 'Failed to delete users',
          response.status
        );
      }

      const data: { message: string; deletedCount: number } = await response.json();
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

  async bulkUpdateRoles(token: string, userIds: string[], roles: string[]): Promise<{ message: string; updatedCount: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/bulk-roles`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds, roles }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || errorData.message || 'Failed to update user roles',
          response.status
        );
      }

      const data: { message: string; updatedCount: number } = await response.json();
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
}

export const adminService = new AdminService();