export interface User {
  id: string
  email: string
}

export interface ApiKey {
  id: string
  key: string
  createdAt: string
  isRevoked: boolean
}

export interface Transaction {
  id: string
  amount: number
  currency: string
  status: string
  createdAt: string
}

export interface Payout {
  id: string
  transactionId: string
  bankAccount: string
  status: string
  processedAt: string | null
}

export interface AuthResponse {
  token: string
  email: string
}
