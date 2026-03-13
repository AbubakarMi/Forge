import apiClient from '@/services/apiClient'

interface ApiResponseWrapper<T> {
  success: boolean
  data: T
}

export interface WalletBalance {
  balance: number
  currency: string
  isActive: boolean
  updatedAt: string
}

export interface WalletTransaction {
  id: string
  type: string
  amount: number
  reference: string
  description: string
  balanceBefore: number
  balanceAfter: number
  payoutBatchId: string | null
  transactionId: string | null
  createdAt: string
}

interface WalletHistoryParams {
  type?: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

interface PaginatedWalletHistory {
  data: WalletTransaction[]
  totalCount: number
  totalPages: number
  page: number
  pageSize: number
}

export const walletService = {
  async getBalance(): Promise<WalletBalance> {
    const response = await apiClient.get<ApiResponseWrapper<WalletBalance>>('/api/wallet')
    return response.data.data
  },

  async getHistory(params?: WalletHistoryParams): Promise<PaginatedWalletHistory> {
    const response = await apiClient.get<ApiResponseWrapper<PaginatedWalletHistory>>(
      '/api/wallet/history',
      { params }
    )
    return response.data.data
  },

  async fundWallet(amount: number): Promise<WalletTransaction> {
    const response = await apiClient.post<ApiResponseWrapper<WalletTransaction>>(
      '/api/wallet/fund',
      { amount }
    )
    return response.data.data
  },
}
