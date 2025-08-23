import { apiClient } from './client'
import { type User, type UpdateUserRequest, type ApiResponse } from '@/types/api.types'

export class UserService {
  async getProfile(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/api/v1/protected/profile')
  }

  async updateProfile(data: UpdateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.put<User>('/api/v1/protected/profile', data)
  }
}

export const userService = new UserService()