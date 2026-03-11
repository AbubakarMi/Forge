// ── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  createdAt: string
}

export interface AuthResponse {
  token: string
  email: string
  tokenExpiresAt: string
}

// ── Organization ────────────────────────────────────────────────────────────
export interface Organization {
  id: string
  name: string
  email: string
  country: string
  role: string
  createdAt: string
  updatedAt: string
}

export interface OrganizationMember {
  id: string
  userId: string
  organizationId: string
  email: string
  role: string
  joinedAt: string
  user?: User
  organization?: Organization
}

// ── API Keys ────────────────────────────────────────────────────────────────
export interface ApiKeyCreated {
  id: string
  keyPrefix: string
  fullKey: string
  createdAt: string
}

export interface ApiKey {
  id: string
  keyPrefix: string
  createdAt: string
  lastUsedAt: string | null
  isRevoked: boolean
}

// ── Audit ──────────────────────────────────────────────────────────────────
export interface AuditLog {
  id: number
  userId: string | null
  organizationId: string | null
  action: string
  entityType: string
  entityId: string | null
  ipAddress: string | null
  details: string | null
  createdAt: string
}

// ── Banks ───────────────────────────────────────────────────────────────────
export interface Bank {
  id: string
  name: string
  code: string
  country: string
  isActive: boolean
  createdAt: string
}

export interface BankAlias {
  id: string
  bankId: string
  alias: string
  createdAt: string
}

// ── Payout Batches ──────────────────────────────────────────────────────────
export interface PayoutBatch {
  id: string
  organizationId: string
  createdByUserId: string
  fileName: string
  totalRecords: number
  totalAmount: number
  successCount: number
  failedCount: number
  pendingCount: number
  status: string
  createdAt: string
  completedAt: string | null
}

export interface PayoutBatchDetail extends PayoutBatch {
  transactions: TransactionDetail[]
}

// ── Transactions ────────────────────────────────────────────────────────────
export interface Transaction {
  id: string
  payoutBatchId: string
  organizationId: string
  recipientName: string
  bankId: string | null
  rawBankName: string
  normalizedBankName: string | null
  accountNumber: string
  amount: number
  currency: string
  status: string
  failureReason: string | null
  normalizationConfidence: number | null
  retryCount: number
  processedAt: string | null
  createdAt: string
}

export interface TransactionDetail extends Transaction {
  bank?: Bank
}

// ── Validation ──────────────────────────────────────────────────────────────
export interface BatchValidationError {
  row: number
  field: string
  message: string
}

// ── Stats ───────────────────────────────────────────────────────────────────
export interface TransactionStats {
  totalTransactions: number
  totalAmount: number
  successCount: number
  failedCount: number
  pendingCount: number
  successRate: number
}

// ── Pagination ──────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

// ── Legacy (will be removed) ────────────────────────────────────────────────
export interface Payout {
  id: string
  transactionId: string
  bankAccount: string
  status: string
  processedAt: string | null
}
