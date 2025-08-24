export interface User {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  roles: string[]
  created_at: string
  updated_at: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
  expires_at: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
}

export interface UpdateUserRequest {
  email?: string
  name?: string
  phone?: string
  company?: string
}

export interface CreateUserRequest {
  name: string
  email: string
  password: string
  phone?: string
  company?: string
  roles?: string[]
}

export interface UpdateUserRolesRequest {
  roles: string[]
}

export interface Role {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description: string
  created_at: string
  updated_at: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface CreateRoleRequest {
  name: string
  description: string
}

export interface UpdateRoleRequest {
  name?: string
  description?: string
}

export interface CreatePermissionRequest {
  name: string
  resource: string
  action: string
  description: string
}

export interface UpdatePermissionRequest {
  name?: string
  resource?: string
  action?: string
  description?: string
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[]
}

export interface AssignPermissionsRequest {
  permission_ids: string[]
}

// Enhanced types for role and permission management
export interface RoleWithPermissionCount extends Role {
  permissionCount: number
  permissions: Permission[]
}

export interface PermissionWithRoleUsage extends Permission {
  usedByRoles: Role[]
  roleCount: number
}

export interface RolePermissionMatrix {
  roleId: string
  permissionId: string
  hasPermission: boolean
}

export interface BulkOperationRequest {
  ids: string[]
}

export interface BulkRoleDeleteRequest extends BulkOperationRequest {
  roleIds: string[]
}

export interface BulkPermissionDeleteRequest extends BulkOperationRequest {
  permissionIds: string[]
}

export interface BulkPermissionAssignRequest {
  permissionIds: string[]
  roleIds: string[]
}

export interface RoleStats {
  totalRoles: number
  totalPermissions: number
  avgPermissionsPerRole: number
  rolesWithoutPermissions: number
  mostUsedPermissions: Permission[]
  recentlyCreatedRoles: Role[]
  permissionDistribution: Record<string, number>
}

export interface PermissionTemplate {
  name: string
  description: string
  permissions: Permission[]
}

export interface RoleFilterOptions {
  search?: string
  sortField?: keyof Role | 'permissionCount'
  sortDirection?: 'asc' | 'desc'
  hasPermissions?: boolean
}

export interface PermissionFilterOptions {
  search?: string
  resource?: string
  action?: string
  sortField?: keyof Permission | 'roleCount'
  sortDirection?: 'asc' | 'desc'
  roleUsage?: 'all' | 'used' | 'unused'
}

// Enhanced role management types
export interface DuplicateRoleRequest {
  originalRoleId: string
  newName: string
  newDescription?: string
  copyPermissions?: boolean
}

export interface RoleAnalytics {
  roleId: string
  roleName: string
  userCount: number
  permissionCount: number
  lastUsed?: string
  createdAt: string
}

export interface PermissionAnalytics {
  permissionId: string
  permissionName: string
  resource: string
  action: string
  roleCount: number
  userCount: number
  createdAt: string
}

export interface SystemSecurityMetrics {
  totalRoles: number
  totalPermissions: number
  totalUsers: number
  adminRoleCount: number
  unusedPermissions: number
  rolesWithoutPermissions: number
  permissionDistribution: Record<string, number>
  recentActivity: {
    rolesCreated: number
    permissionsCreated: number
    assignmentsChanged: number
    lastWeek: boolean
  }
}

export interface MatrixExportOptions {
  format: 'csv' | 'xlsx' | 'json'
  includeHeaders: boolean
  includeStats: boolean
  filterByResource?: string[]
  filterByAction?: string[]
}

// Email Template Types
export interface EmailTemplate {
  id: string
  name: string
  subject: string
  html_template: string
  text_template: string
  variables: TemplateVariable[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TemplateVariable {
  name: string
  description: string
}

export interface CreateEmailTemplateRequest {
  name: string
  subject: string
  html_template: string
  text_template: string
  variables: TemplateVariable[]
  is_active?: boolean
}

export interface UpdateEmailTemplateRequest {
  name?: string
  subject?: string
  html_template?: string
  text_template?: string
  variables?: TemplateVariable[]
  is_active?: boolean
}

export interface PreviewEmailTemplateRequest {
  variables: Record<string, string>
}

export interface PreviewEmailTemplateResponse {
  subject: string
  html_content: string
  text_content: string
}

export interface TestEmailTemplateRequest {
  email: string
  variables: Record<string, string>
}