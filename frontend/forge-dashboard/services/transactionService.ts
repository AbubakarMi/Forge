import apiClient from './apiClient'
import { Transaction } from '@/types'

export const transactionService = {
  async getTransactions(): Promise<Transaction[]> {
    const response = await apiClient.get<Transaction[]>('/api/transactions')
    return response.data
  },
}
