import { apiClient } from './client'
import {
  type LoginRequest,
  type RegisterRequest,
  type LoginResponse,
  type ForgotPasswordRequest,
  type ResetPasswordRequest,
  type User,
  type ApiResponse,
} from '@/types/api.types'

export class AuthService {
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post<LoginResponse>('/api/v1/auth/login', credentials)
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<User>> {
    return apiClient.post<User>('/api/v1/auth/register', userData)
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<null>> {
    return apiClient.post<null>('/api/v1/auth/forgot-password', data)
  }

  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<null>> {
    return apiClient.post<null>('/api/v1/auth/reset-password', data)
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/api/v1/protected/profile')
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return apiClient.put<User>('/api/v1/protected/profile', data)
  }

  setToken(token: string): void {
    localStorage.setItem('auth_token', token)
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  setUser(user: User): void {
    localStorage.setItem('auth_user', JSON.stringify(user))
  }

  getUser(): User | null {
    const userStr = localStorage.getItem('auth_user')
    return userStr ? JSON.parse(userStr) : null
  }

  logout(): void {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  isAuthenticated(): boolean {
    return !!this.getToken()
  }
}

export const authService = new AuthService()