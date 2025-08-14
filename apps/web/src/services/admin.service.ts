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
}

export const adminService = new AdminService();