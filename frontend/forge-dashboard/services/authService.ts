import apiClient from './apiClient'
import { AuthResponse } from '@/types'

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', {
      email,
      password,
    })
    return response.data
  },

  async register(email: string, password: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/api/auth/register', {
      email,
      password,
    })
    return response.data
  },
}
