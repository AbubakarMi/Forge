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

  async confirmBatch(id: string, params: {
    batchName: string
    paymentType?: string
    scheduledAt?: string
    recurringInterval?: string
  }): Promise<void> {
    await apiClient.post(`/api/payout-batches/${id}/confirm`, params)
  },

  async addRecipients(id: string, file: File): Promise<{
    addedCount: number
    failedCount: number
    addedAmount: number
    errors: { rowNumber: number; field: string; message: string }[]
  }> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post<ApiResponseWrapper<{
      addedCount: number
      failedCount: number
      addedAmount: number
      errors: { rowNumber: number; field: string; message: string }[]
    }>>(`/api/payout-batches/${id}/add-recipients`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
    return response.data.data
  },

  async updateTransaction(batchId: string, transactionId: string, data: {
    recipientName: string
    bankName: string
    accountNumber: string
    amount: number
  }): Promise<{
    id: string
    status: string
    failureReason: string | null
    normalizedBankName: string | null
    normalizationConfidence: number | null
  }> {
    const response = await apiClient.put<ApiResponseWrapper<{
      id: string
      status: string
      failureReason: string | null
      normalizedBankName: string | null
      normalizationConfidence: number | null
    }>>(`/api/payout-batches/${batchId}/transactions/${transactionId}`, data)
    return response.data.data
  },

  async reuploadFailed(batchId: string, file: File): Promise<{
    replacedCount: number
    stillFailedCount: number
    newValidCount: number
    totalAmount: number
    errors: { rowNumber: number; field: string; message: string }[]
  }> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post<ApiResponseWrapper<{
      replacedCount: number
      stillFailedCount: number
      newValidCount: number
      totalAmount: number
      errors: { rowNumber: number; field: string; message: string }[]
    }>>(`/api/payout-batches/${batchId}/reupload-failed`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
    return response.data.data
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
