import { apiClient } from './client'
import {
  type User,
  type UpdateUserRequest,
  type CreateUserRequest,
  type UpdateUserRolesRequest,
  type Role,
  type Permission,
  type PaginatedResponse,
  type ApiResponse,
} from '@/types/api.types'

export class AdminService {
  // User management
  async getUsers(params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<User>>> {
    return apiClient.get<PaginatedResponse<User>>('/api/v1/admin/users', params)
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    return apiClient.get<User>(`/api/v1/admin/users/${id}`)
  }

  async createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.post<User>('/api/v1/admin/users', data)
  }

  async updateUser(id: string, data: UpdateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.put<User>(`/api/v1/admin/users/${id}`, data)
  }

  async deleteUser(id: string): Promise<ApiResponse<null>> {
    return apiClient.delete<null>(`/api/v1/admin/users/${id}`)
  }

  // User roles management
  async updateUserRoles(id: string, data: UpdateUserRolesRequest): Promise<ApiResponse<User>> {
    return apiClient.put<User>(`/api/v1/admin/users/${id}/roles`, data)
  }

  // Roles management
  async getRoles(): Promise<ApiResponse<Role[]>> {
    return apiClient.get<Role[]>('/api/v1/admin/roles')
  }

  // Permissions management
  async getUserPermissions(userId: string): Promise<ApiResponse<Permission[]>> {
    return apiClient.get<Permission[]>(`/api/v1/admin/users/${userId}/permissions`)
  }

  async getUserPermission(userId: string, permissionId: string): Promise<ApiResponse<Permission>> {
    return apiClient.get<Permission>(`/api/v1/admin/users/${userId}/permissions/${permissionId}`)
  }
}

export const adminService = new AdminService()