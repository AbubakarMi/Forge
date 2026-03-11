import apiClient from './apiClient'
import { TransactionDetail, TransactionStats, PaginatedResponse } from '@/types'

interface ApiResponseWrapper<T> {
  success: boolean
  data: T
}

interface TransactionFilters {
  status?: string
  batchId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  pageSize?: number
}

export const transactionService = {
  async getTransactions(filters?: TransactionFilters): Promise<PaginatedResponse<TransactionDetail>> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.batchId) params.append('batchId', filters.batchId)
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom)
    if (filters?.dateTo) params.append('dateTo', filters.dateTo)
    if (filters?.search) params.append('search', filters.search)
    params.append('page', String(filters?.page || 1))
    params.append('pageSize', String(filters?.pageSize || 20))

    const res = await apiClient.get<ApiResponseWrapper<PaginatedResponse<TransactionDetail>>>(`/api/transactions?${params}`)
    return res.data.data
  },

  async getTransaction(id: string): Promise<TransactionDetail> {
    const res = await apiClient.get<ApiResponseWrapper<TransactionDetail>>(`/api/transactions/${id}`)
    return res.data.data
  },

  async getTransactionStats(): Promise<TransactionStats> {
    const res = await apiClient.get<ApiResponseWrapper<TransactionStats>>('/api/transactions/stats')
    return res.data.data
  },
}
