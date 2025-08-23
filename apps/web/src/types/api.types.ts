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