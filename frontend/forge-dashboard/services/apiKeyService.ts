import apiClient from './apiClient'
import { ApiKey, ApiKeyCreated } from '@/types'

interface ApiResponseWrapper<T> {
  success: boolean
  data: T
  message: string
  errors: string[]
}

export const apiKeyService = {
  async createKey(permissions?: string): Promise<ApiKeyCreated> {
    const response = await apiClient.post<ApiResponseWrapper<ApiKeyCreated>>('/api/apikeys', { permissions })
    return response.data.data
  },

  async getKeys(): Promise<ApiKey[]> {
    const response = await apiClient.get<ApiResponseWrapper<ApiKey[]>>('/api/apikeys')
    return response.data.data
  },

  async revokeKey(id: string): Promise<void> {
    await apiClient.delete(`/api/apikeys/${id}`)
  },
}
