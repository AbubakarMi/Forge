import apiClient from './apiClient'
import { Payout } from '@/types'

export const payoutService = {
  async createPayout(transactionId: string, bankAccount: string): Promise<Payout> {
    const response = await apiClient.post<Payout>('/api/payouts', {
      transactionId,
      bankAccount,
    })
    return response.data
  },

  async getPayouts(): Promise<Payout[]> {
    const response = await apiClient.get<Payout[]>('/api/payouts')
    return response.data
  },
}
