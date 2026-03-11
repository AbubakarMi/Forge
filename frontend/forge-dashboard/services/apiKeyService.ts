import apiClient from './apiClient'
import { ApiKey } from '@/types'

export const apiKeyService = {
  async createKey(): Promise<ApiKey> {
    const response = await apiClient.post<ApiKey>('/api/apikeys/create')
    return response.data
  },

  async getKeys(): Promise<ApiKey[]> {
    const response = await apiClient.get<ApiKey[]>('/api/apikeys')
    return response.data
  },

  async revokeKey(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/api/apikeys/${id}`)
    return response.data
  },
}
