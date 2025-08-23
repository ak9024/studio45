import axios, { type AxiosInstance, type AxiosResponse, type AxiosError } from 'axios'
import { type ApiResponse } from '@/types/api.types'

class ApiClient {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_HOST || 'http://localhost:8080',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token if available
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor - Handle common errors
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse<any>>) => {
        return response
      },
      (error: AxiosError<ApiResponse<any>>) => {
        // Handle 401 - Unauthorized (but not for auth endpoints)
        if (error.response?.status === 401) {
          // Don't redirect if this is an auth endpoint (login, register, etc.)
          const isAuthEndpoint = error.config?.url?.includes('/api/v1/auth/')
          
          if (!isAuthEndpoint) {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_user')
            window.location.href = '/login'
          }
        }

        // Handle other common errors
        if (error.response?.status === 500) {
          console.error('Server error:', error.response.data?.message)
        }

        return Promise.reject(error)
      }
    )
  }

  async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.get<ApiResponse<T>>(url, { params })
    return response.data
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.post<ApiResponse<T>>(url, data)
    return response.data
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.put<ApiResponse<T>>(url, data)
    return response.data
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.instance.delete<ApiResponse<T>>(url)
    return response.data
  }

  async patch<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.patch<ApiResponse<T>>(url, data)
    return response.data
  }
}

export const apiClient = new ApiClient()