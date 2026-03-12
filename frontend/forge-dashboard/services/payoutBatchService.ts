import apiClient from '@/services/apiClient'
import { PayoutBatch, PayoutBatchDetail, PaginatedResponse } from '@/types'

interface ApiResponseWrapper<T> {
  success: boolean
  data: T
}

export interface CreateBatchResponse {
  batchId: string
  fileName: string
  totalRecords: number
  validRecords: number
  invalidRecords: number
  totalAmount: number
  errors: { rowNumber: number; field: string; message: string }[]
}

export interface BatchSummary {
  totalRecords: number
  totalAmount: number
  successCount: number
  failedCount: number
  pendingCount: number
  successRate: number
  successAmount: number
  failedAmount: number
  pendingAmount: number
}

interface GetBatchesParams {
  status?: string
  fileName?: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export const payoutBatchService = {
  async uploadBatch(file: File): Promise<CreateBatchResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post<ApiResponseWrapper<CreateBatchResponse>>(
      '/api/payout-batches/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      }
    )
    return response.data.data
  },

  async getBatches(params?: GetBatchesParams): Promise<PaginatedResponse<PayoutBatch>> {
    const response = await apiClient.get<ApiResponseWrapper<PaginatedResponse<PayoutBatch>>>(
      '/api/payout-batches',
      { params }
    )
    return response.data.data
  },

  async getBatchDetail(id: string): Promise<PayoutBatchDetail> {
    const response = await apiClient.get<ApiResponseWrapper<PayoutBatchDetail>>(
      `/api/payout-batches/${id}`
    )
    return response.data.data
  },

  async getBatchSummary(id: string): Promise<BatchSummary> {
    const response = await apiClient.get<ApiResponseWrapper<BatchSummary>>(
      `/api/payout-batches/${id}/summary`
    )
    return response.data.data
  },

  async retryFailed(id: string): Promise<{ retriedCount: number }> {
    const response = await apiClient.post<ApiResponseWrapper<{ retriedCount: number }>>(
      `/api/payout-batches/${id}/retry`
    )
    return response.data.data
  },

  async confirmBatch(id: string, batchName: string): Promise<void> {
    await apiClient.post(`/api/payout-batches/${id}/confirm`, { batchName })
  },

  async confirmDuplicates(id: string): Promise<{ confirmedCount: number }> {
    const response = await apiClient.post<ApiResponseWrapper<{ confirmedCount: number }>>(
      `/api/payout-batches/${id}/confirm-duplicates`
    )
    return response.data.data
  },

  async cancelBatch(id: string): Promise<void> {
    await apiClient.post(`/api/payout-batches/${id}/cancel`)
  },
}
