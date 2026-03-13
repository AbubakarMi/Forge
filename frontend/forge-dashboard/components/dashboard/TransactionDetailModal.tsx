'use client'

import { TransactionDetail } from '@/types'
import StatusBadge from '@/components/ui/StatusBadge'

interface Props {
  transaction: TransactionDetail | null
  onClose: () => void
}

function getConfidenceColor(confidence: number | null): string {
  if (confidence === null) return 'text-gray-400'
  if (confidence >= 0.9) return 'text-green-600'
  if (confidence >= 0.7) return 'text-yellow-600'
  return 'text-red-600'
}

function getConfidenceBg(confidence: number | null): string {
  if (confidence === null) return 'bg-gray-100'
  if (confidence >= 0.9) return 'bg-green-50'
  if (confidence >= 0.7) return 'bg-yellow-50'
  return 'bg-red-50'
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency || 'NGN',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-2">
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <span className="text-sm text-gray-900 text-right max-w-[60%]">{children}</span>
    </div>
  )
}

export default function TransactionDetailModal({ transaction, onClose }: Props) {
  if (!transaction) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Transaction Details</h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{transaction.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Recipient Info */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recipient Info</h3>
            <div className="bg-gray-50 rounded-lg px-4 py-1 divide-y divide-gray-200">
              <DetailRow label="Name">{transaction.recipientName}</DetailRow>
              <DetailRow label="Account Number">
                <span className="font-mono">{transaction.accountNumber}</span>
              </DetailRow>
            </div>
          </section>

          {/* Bank Info */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Bank Info</h3>
            <div className="bg-gray-50 rounded-lg px-4 py-1 divide-y divide-gray-200">
              <DetailRow label="Raw Bank Name">{transaction.rawBankName}</DetailRow>
              <DetailRow label="Normalized Name">
                {transaction.normalizedBankName || <span className="text-gray-400 italic">No match</span>}
              </DetailRow>
              {transaction.bank && (
                <DetailRow label="Bank Code">
                  <span className="font-mono">{transaction.bank.code}</span>
                </DetailRow>
              )}
              <DetailRow label="Confidence">
                {transaction.normalizationConfidence !== null ? (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getConfidenceBg(transaction.normalizationConfidence)} ${getConfidenceColor(transaction.normalizationConfidence)}`}>
                    {(transaction.normalizationConfidence * 100).toFixed(0)}%
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </DetailRow>
            </div>
          </section>

          {/* Payment */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Payment</h3>
            <div className="bg-gray-50 rounded-lg px-4 py-1 divide-y divide-gray-200">
              <DetailRow label="Amount">
                <span className="font-semibold">{formatCurrency(transaction.amount, transaction.currency)}</span>
              </DetailRow>
              <DetailRow label="Currency">
                <span className="uppercase">{transaction.currency}</span>
              </DetailRow>
              {transaction.fee !== null && transaction.fee !== undefined && (
                <DetailRow label="Provider Fee">
                  <span className="text-amber-600 font-medium">{formatCurrency(transaction.fee, transaction.currency)}</span>
                </DetailRow>
              )}
            </div>
          </section>

          {/* Provider Info */}
          {(transaction.providerReference || transaction.providerStatus || transaction.verifiedAccountName) && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Provider Info</h3>
              <div className="bg-gray-50 rounded-lg px-4 py-1 divide-y divide-gray-200">
                {transaction.providerReference && (
                  <DetailRow label="Provider Reference">
                    <span className="font-mono text-xs">{transaction.providerReference}</span>
                  </DetailRow>
                )}
                {transaction.providerStatus && (
                  <DetailRow label="Provider Status">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                      transaction.providerStatus === 'success' ? 'bg-green-50 text-green-700'
                        : transaction.providerStatus === 'failed' ? 'bg-red-50 text-red-700'
                        : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      {transaction.providerStatus}
                    </span>
                  </DetailRow>
                )}
                {transaction.verifiedAccountName && (
                  <DetailRow label="Verified Account Name">
                    {transaction.verifiedAccountName}
                  </DetailRow>
                )}
              </div>
            </section>
          )}

          {/* Status */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Status</h3>
            <div className="bg-gray-50 rounded-lg px-4 py-1 divide-y divide-gray-200">
              <DetailRow label="Current Status">
                <StatusBadge status={transaction.status} />
              </DetailRow>
              {transaction.failureReason && (
                <DetailRow label="Failure Reason">
                  <span className="text-red-600">{transaction.failureReason}</span>
                </DetailRow>
              )}
              <DetailRow label="Retry Count">{transaction.retryCount}</DetailRow>
            </div>
          </section>

          {/* Timeline */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Timeline</h3>
            <div className="bg-gray-50 rounded-lg px-4 py-1 divide-y divide-gray-200">
              <DetailRow label="Created">{formatDate(transaction.createdAt)}</DetailRow>
              <DetailRow label="Processed">{formatDate(transaction.processedAt)}</DetailRow>
            </div>
          </section>

          {/* Batch Link */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Batch</h3>
            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <a
                href={`/dashboard/batches/${transaction.payoutBatchId}`}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
              >
                View Batch {transaction.payoutBatchId.slice(0, 8)}...
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
