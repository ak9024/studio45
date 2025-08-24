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
  type CreateRoleRequest,
  type UpdateRoleRequest,
  type CreatePermissionRequest,
  type UpdatePermissionRequest,
  type RoleWithPermissions,
  type AssignPermissionsRequest,
  type EmailTemplate,
  type CreateEmailTemplateRequest,
  type UpdateEmailTemplateRequest,
  type PreviewEmailTemplateRequest,
  type PreviewEmailTemplateResponse,
  type TestEmailTemplateRequest,
  type TemplateVariable,
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

  async getRole(id: string): Promise<ApiResponse<Role>> {
    return apiClient.get<Role>(`/api/v1/admin/roles/${id}`)
  }

  async createRole(data: CreateRoleRequest): Promise<ApiResponse<Role>> {
    return apiClient.post<Role>('/api/v1/admin/roles', data)
  }

  async updateRole(id: string, data: UpdateRoleRequest): Promise<ApiResponse<Role>> {
    return apiClient.put<Role>(`/api/v1/admin/roles/${id}`, data)
  }

  async deleteRole(id: string): Promise<ApiResponse<null>> {
    return apiClient.delete<null>(`/api/v1/admin/roles/${id}`)
  }

  async getRolePermissions(roleId: string): Promise<ApiResponse<Permission[]>> {
    return apiClient.get<Permission[]>(`/api/v1/admin/roles/${roleId}/permissions`)
  }

  async updateRolePermissions(roleId: string, data: AssignPermissionsRequest): Promise<ApiResponse<RoleWithPermissions>> {
    return apiClient.put<RoleWithPermissions>(`/api/v1/admin/roles/${roleId}/permissions`, data)
  }

  // Permissions management
  async getPermissions(): Promise<ApiResponse<Permission[]>> {
    return apiClient.get<Permission[]>('/api/v1/admin/permissions')
  }

  async getPermission(id: string): Promise<ApiResponse<Permission>> {
    return apiClient.get<Permission>(`/api/v1/admin/permissions/${id}`)
  }

  async createPermission(data: CreatePermissionRequest): Promise<ApiResponse<Permission>> {
    return apiClient.post<Permission>('/api/v1/admin/permissions', data)
  }

  async updatePermission(id: string, data: UpdatePermissionRequest): Promise<ApiResponse<Permission>> {
    return apiClient.put<Permission>(`/api/v1/admin/permissions/${id}`, data)
  }

  async deletePermission(id: string): Promise<ApiResponse<null>> {
    return apiClient.delete<null>(`/api/v1/admin/permissions/${id}`)
  }

  // User permissions (keep existing methods for backward compatibility)
  async getUserPermissions(userId: string): Promise<ApiResponse<Permission[]>> {
    return apiClient.get<Permission[]>(`/api/v1/admin/users/${userId}/permissions`)
  }

  async getUserPermission(userId: string, permissionId: string): Promise<ApiResponse<Permission>> {
    return apiClient.get<Permission>(`/api/v1/admin/users/${userId}/permissions/${permissionId}`)
  }

  // Email Templates management
  async getEmailTemplates(): Promise<ApiResponse<{ templates: EmailTemplate[]; total: number }>> {
    return apiClient.get<{ templates: EmailTemplate[]; total: number }>('/api/v1/admin/email-templates')
  }

  async getEmailTemplate(id: string): Promise<ApiResponse<EmailTemplate>> {
    return apiClient.get<EmailTemplate>(`/api/v1/admin/email-templates/${id}`)
  }

  async createEmailTemplate(data: CreateEmailTemplateRequest): Promise<ApiResponse<EmailTemplate>> {
    return apiClient.post<EmailTemplate>('/api/v1/admin/email-templates', data)
  }

  async updateEmailTemplate(id: string, data: UpdateEmailTemplateRequest): Promise<ApiResponse<EmailTemplate>> {
    return apiClient.put<EmailTemplate>(`/api/v1/admin/email-templates/${id}`, data)
  }

  async deleteEmailTemplate(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/api/v1/admin/email-templates/${id}`)
  }

  async previewEmailTemplate(id: string, data: PreviewEmailTemplateRequest): Promise<ApiResponse<PreviewEmailTemplateResponse>> {
    return apiClient.post<PreviewEmailTemplateResponse>(`/api/v1/admin/email-templates/${id}/preview`, data)
  }

  async testEmailTemplate(id: string, data: TestEmailTemplateRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(`/api/v1/admin/email-templates/${id}/test`, data)
  }

  async getEmailTemplateVariables(id: string): Promise<ApiResponse<{ variables: TemplateVariable[] }>> {
    return apiClient.get<{ variables: TemplateVariable[] }>(`/api/v1/admin/email-templates/${id}/variables`)
  }
}

export const adminService = new AdminService()