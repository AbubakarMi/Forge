import apiClient from './apiClient'
import { AuthResponse } from '@/types'

interface ApiResponseWrapper<T> {
  success: boolean
  data: T
  message: string
  errors: string[]
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponseWrapper<AuthResponse>>('/api/auth/login', {
      email,
      password,
    })
    return response.data.data
  },

  async register(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponseWrapper<AuthResponse>>('/api/auth/register', {
      email,
      password,
    })
    return response.data.data
  },

  async refresh(): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponseWrapper<AuthResponse>>('/api/auth/refresh')
    return response.data.data
  },

  async revoke(): Promise<void> {
    await apiClient.post('/api/auth/revoke')
  },
}
