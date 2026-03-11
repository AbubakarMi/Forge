import apiClient from './apiClient'

interface ApiResponseWrapper<T> {
  success: boolean
  data: T
}

export interface SummaryReport {
  totalBatches: number
  totalTransactions: number
  totalVolume: number
  successRate: number
  completedCount: number
  failedCount: number
  pendingCount: number
  topBanks: { bankName: string; transactionCount: number; totalAmount: number; successRate: number }[]
  dailyBreakdown: { date: string; transactionCount: number; amount: number; successCount: number; failedCount: number }[]
}

export const reportService = {
  async exportBatchResults(batchId: string): Promise<void> {
    const res = await apiClient.get(`/api/reports/batches/${batchId}/export`, { responseType: 'blob' })
    downloadBlob(res.data, `batch-${batchId}-results.csv`)
  },

  async exportTransactions(filters?: { status?: string; dateFrom?: string; dateTo?: string }): Promise<void> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom)
    if (filters?.dateTo) params.append('dateTo', filters.dateTo)
    const res = await apiClient.get(`/api/reports/transactions/export?${params}`, { responseType: 'blob' })
    downloadBlob(res.data, `transactions-${new Date().toISOString().split('T')[0]}.csv`)
  },

  async getSummaryReport(dateFrom?: string, dateTo?: string): Promise<SummaryReport> {
    const params = new URLSearchParams()
    if (dateFrom) params.append('from', dateFrom)
    if (dateTo) params.append('to', dateTo)
    const res = await apiClient.get<ApiResponseWrapper<SummaryReport>>(`/api/reports/summary?${params}`)
    return res.data.data
  },
}

function downloadBlob(data: Blob, filename: string) {
  const url = window.URL.createObjectURL(new Blob([data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
