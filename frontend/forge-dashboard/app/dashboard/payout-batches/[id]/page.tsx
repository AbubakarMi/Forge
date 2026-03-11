'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { payoutBatchService } from '@/services/payoutBatchService'
import { PayoutBatchDetail, TransactionDetail } from '@/types'
import StatusBadge from '@/components/ui/StatusBadge'
import ProgressBar from '@/components/ui/ProgressBar'
import { showToast } from '@/hooks/useToast'

type TabFilter = 'all' | 'pending' | 'completed' | 'failed'

export default function PayoutBatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [batch, setBatch] = useState<PayoutBatchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabFilter>('all')
  const [showRetryConfirm, setShowRetryConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const loadBatch = useCallback(async () => {
    try {
      const data = await payoutBatchService.getBatchDetail(id)
      setBatch(data)
    } catch {
      showToast('error', 'Failed to load batch details.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadBatch()
  }, [loadBatch])

  const handleRetry = async () => {
    setRetrying(true)
    try {
      const result = await payoutBatchService.retryFailed(id)
      showToast('success', `Retrying ${result.retriedCount} failed transactions.`)
      setShowRetryConfirm(false)
      await loadBatch()
    } catch {
      showToast('error', 'Failed to retry transactions.')
    } finally {
      setRetrying(false)
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await payoutBatchService.cancelBatch(id)
      showToast('success', 'Batch cancelled.')
      setShowCancelConfirm(false)
      await loadBatch()
    } catch {
      showToast('error', 'Failed to cancel batch.')
    } finally {
      setCancelling(false)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="h-4 bg-gray-200 rounded w-40" />
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Batch not found.</p>
        <button
          onClick={() => router.push('/dashboard/payout-batches')}
          className="mt-4 text-sm text-forge-primary hover:underline"
        >
          Back to Payout Batches
        </button>
      </div>
    )
  }

  const filteredTransactions: TransactionDetail[] =
    tab === 'all'
      ? batch.transactions
      : batch.transactions.filter((t) => t.status.toLowerCase() === tab)

  const hasFailedTransactions = batch.transactions.some(
    (t) => t.status.toLowerCase() === 'failed'
  )
  const isPending = batch.status.toLowerCase() === 'pending'

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: batch.transactions.length },
    { key: 'pending', label: 'Pending', count: batch.pendingCount },
    { key: 'completed', label: 'Completed', count: batch.successCount },
    { key: 'failed', label: 'Failed', count: batch.failedCount },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => router.push('/dashboard/payout-batches')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{batch.fileName}</h1>
            <StatusBadge status={batch.status} />
          </div>
          <p className="text-sm text-gray-500 ml-8">Created {formatDate(batch.createdAt)}</p>
        </div>

        <div className="flex gap-2">
          {hasFailedTransactions && (
            <button
              onClick={() => setShowRetryConfirm(true)}
              className="px-4 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
            >
              Retry Failed
            </button>
          )}
          {isPending && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              Cancel Batch
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 font-medium">Total Records</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{batch.totalRecords}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 font-medium">Total Amount</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(batch.totalAmount)}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 shadow-sm p-4 bg-green-50/50">
          <p className="text-xs text-green-600 font-medium">Success</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{batch.successCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-4 bg-red-50/50">
          <p className="text-xs text-red-600 font-medium">Failed</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{batch.failedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-yellow-200 shadow-sm p-4 bg-yellow-50/50">
          <p className="text-xs text-yellow-600 font-medium">Pending</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">{batch.pendingCount}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <ProgressBar
          success={batch.successCount}
          failed={batch.failedCount}
          pending={batch.pendingCount}
        />
      </div>

      {/* Transaction tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? 'border-forge-primary text-forge-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Transaction table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recipient</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Raw Bank</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Normalized Bank</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Confidence</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Failure Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{txn.recipientName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{txn.rawBankName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {txn.normalizedBankName || (
                        <span className="text-gray-400 italic">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">
                        {txn.accountNumber}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(txn.amount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={txn.status} />
                    </td>
                    <td className="px-4 py-3">
                      {txn.normalizationConfidence != null ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            txn.normalizationConfidence >= 0.9
                              ? 'bg-green-100 text-green-800'
                              : txn.normalizationConfidence >= 0.7
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {(txn.normalizationConfidence * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 max-w-[200px] truncate">
                      {txn.failureReason || <span className="text-gray-400">--</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Retry confirmation modal */}
      {showRetryConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Retry Failed Transactions?</h2>
            <p className="text-sm text-gray-500 mb-6">
              This will re-queue all failed transactions in this batch for processing.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {retrying ? 'Retrying...' : 'Confirm Retry'}
              </button>
              <button
                onClick={() => setShowRetryConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirmation modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Cancel This Batch?</h2>
            <p className="text-sm text-gray-500 mb-6">
              This will cancel all pending transactions in this batch. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
