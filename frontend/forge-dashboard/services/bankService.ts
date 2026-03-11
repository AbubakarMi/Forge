import apiClient from './apiClient'
import { Bank, BankAlias } from '@/types'

interface ApiResponseWrapper<T> {
  success: boolean
  data: T
  message: string
  errors: string[]
}

interface BankListItem {
  id: string
  name: string
  code: string
  country: string
  isActive: boolean
  aliasCount: number
}

interface BankDetail {
  id: string
  name: string
  code: string
  country: string
  isActive: boolean
  createdAt: string
  aliases: { id: string; alias: string; createdAt: string }[]
}

export const bankService = {
  async getBanks(): Promise<BankListItem[]> {
    const response = await apiClient.get<ApiResponseWrapper<BankListItem[]>>('/api/banks')
    return response.data.data
  },

  async getBank(id: string): Promise<BankDetail> {
    const response = await apiClient.get<ApiResponseWrapper<BankDetail>>(`/api/banks/${id}`)
    return response.data.data
  },

  async searchBanks(query: string): Promise<BankListItem[]> {
    const response = await apiClient.get<ApiResponseWrapper<BankListItem[]>>(`/api/banks/search?query=${encodeURIComponent(query)}`)
    return response.data.data
  },

  async createBank(data: { name: string; code: string; country: string }): Promise<BankDetail> {
    const response = await apiClient.post<ApiResponseWrapper<BankDetail>>('/api/banks', data)
    return response.data.data
  },

  async addAlias(bankId: string, alias: string): Promise<{ id: string; alias: string; createdAt: string }> {
    const response = await apiClient.post<ApiResponseWrapper<{ id: string; alias: string; createdAt: string }>>(`/api/banks/${bankId}/aliases`, { alias })
    return response.data.data
  },
}
