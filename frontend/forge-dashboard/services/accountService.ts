import apiClient from '@/services/apiClient'

interface ApiResponseWrapper<T> {
  success: boolean
  data: T
}

export interface AccountVerification {
  isValid: boolean
  accountName: string | null
  bankName: string | null
  bankCode: string | null
}

export const accountService = {
  async verifyAccount(accountNumber: string, bankCode: string): Promise<AccountVerification> {
    const response = await apiClient.get<ApiResponseWrapper<AccountVerification>>(
      '/api/accounts/verify',
      { params: { accountNumber, bankCode } }
    )
    return response.data.data
  },
}
