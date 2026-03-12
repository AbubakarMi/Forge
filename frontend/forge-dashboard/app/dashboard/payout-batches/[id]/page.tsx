'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { payoutBatchService, BatchSummary } from '@/services/payoutBatchService'
import { reportService } from '@/services/reportService'
import { PayoutBatchDetail, TransactionDetail } from '@/types'
import StatusBadge from '@/components/ui/StatusBadge'
import ProgressBar from '@/components/ui/ProgressBar'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { showToast } from '@/hooks/useToast'

type TabFilter = 'all' | 'pending' | 'completed' | 'failed'

export default function PayoutBatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [batch, setBatch] = useState<PayoutBatchDetail | null>(null)
  const [summary, setSummary] = useState<BatchSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabFilter>('all')
  const [showRetryConfirm, setShowRetryConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [exportingCsv, setExportingCsv] = useState(false)
  const [selectedTxn, setSelectedTxn] = useState<TransactionDetail | null>(null)

  // Add recipients
  const [showAddRecipients, setShowAddRecipients] = useState(false)
  const [addFile, setAddFile] = useState<File | null>(null)
  const [addingRecipients, setAddingRecipients] = useState(false)
  const [showEndRecurring, setShowEndRecurring] = useState(false)
  const [endingRecurring, setEndingRecurring] = useState(false)

  const loadBatch = useCallback(async () => {
    try {
      const [data, sum] = await Promise.all([
        payoutBatchService.getBatchDetail(id),
        payoutBatchService.getBatchSummary(id).catch(() => null),
      ])
      setBatch(data)
      setSummary(sum)
    } catch {
      showToast('error', 'Failed to load batch details.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadBatch()
  }, [loadBatch])

  // Auto-refresh while processing
  useEffect(() => {
    if (!batch || (batch.status !== 'pending' && batch.status !== 'processing')) return
    const interval = setInterval(loadBatch, 5000)
    return () => clearInterval(interval)
  }, [batch?.status, loadBatch])

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

  const handleExportCsv = async () => {
    setExportingCsv(true)
    try {
      await reportService.exportBatchResults(id)
      showToast('success', 'Batch results exported.')
    } catch {
      showToast('error', 'Failed to export batch results.')
    } finally {
      setExportingCsv(false)
    }
  }

  const handleAddRecipients = async () => {
    if (!addFile) return
    setAddingRecipients(true)
    try {
      const result = await payoutBatchService.addRecipients(id, addFile)
      showToast('success', `${result.addedCount} recipient(s) added to batch.`)
      if (result.failedCount > 0) {
        showToast('warning', `${result.failedCount} record(s) failed validation.`)
      }
      setShowAddRecipients(false)
      setAddFile(null)
      await loadBatch()
    } catch {
      showToast('error', 'Failed to add recipients.')
    } finally {
      setAddingRecipients(false)
    }
  }

  const handleEndRecurring = async () => {
    setEndingRecurring(true)
    try {
      await payoutBatchService.endRecurring(id)
      showToast('success', 'Recurring schedule ended.')
      setShowEndRecurring(false)
      await loadBatch()
    } catch {
      showToast('error', 'Failed to end recurring schedule.')
    } finally {
      setEndingRecurring(false)
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
  const isActive = batch.status === 'pending' || batch.status === 'processing'

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
            <h1 className="text-2xl font-bold text-gray-900">{batch.batchName || batch.fileName}</h1>
            <StatusBadge status={batch.status} />
            {isActive && (
              <span className="flex items-center gap-1 text-xs text-blue-600">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Auto-refreshing
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 ml-8">
            Created {formatDate(batch.createdAt)}
            {batch.completedAt && <> &middot; Completed {formatDate(batch.completedAt)}</>}
          </p>
          {(batch.isRecurring || batch.paymentType === 'scheduled') && (
            <div className="flex items-center gap-3 ml-8 mt-1.5">
              {batch.isRecurring && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Recurring {batch.recurringInterval}
                </span>
              )}
              {batch.scheduledAt && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {batch.status === 'scheduled' ? 'Scheduled for' : 'Was scheduled for'} {formatDate(batch.scheduledAt)}
                </span>
              )}
              {batch.nextRunAt && batch.isRecurring && (
                <span className="text-xs text-gray-500">
                  Next run: {formatDate(batch.nextRunAt)}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {batch.isRecurring && (
            <button
              onClick={() => setShowEndRecurring(true)}
              className="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              End Recurring
            </button>
          )}
          {(batch.isRecurring || batch.paymentType === 'scheduled' || batch.status === 'completed' || batch.status === 'partially_failed') && (
            <button
              onClick={() => setShowAddRecipients(true)}
              className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              Add Recipients
            </button>
          )}
          <button
            onClick={handleExportCsv}
            disabled={exportingCsv}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {exportingCsv ? 'Exporting...' : 'Export CSV'}
          </button>
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
          {summary && <p className="text-xs text-green-500 mt-0.5">{formatCurrency(summary.successAmount)}</p>}
        </div>
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-4 bg-red-50/50">
          <p className="text-xs text-red-600 font-medium">Failed</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{batch.failedCount}</p>
          {summary && <p className="text-xs text-red-500 mt-0.5">{formatCurrency(summary.failedAmount)}</p>}
        </div>
        <div className="bg-white rounded-xl border border-yellow-200 shadow-sm p-4 bg-yellow-50/50">
          <p className="text-xs text-yellow-600 font-medium">Pending</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">{batch.pendingCount}</p>
          {summary && <p className="text-xs text-yellow-500 mt-0.5">{formatCurrency(summary.pendingAmount)}</p>}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">Batch Progress</span>
          {summary && (
            <span className="text-xs font-semibold text-gray-700">
              {summary.successRate.toFixed(1)}% success rate
            </span>
          )}
        </div>
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bank</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Failure Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => (
                  <tr
                    key={txn.id}
                    onClick={() => setSelectedTxn(txn)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{txn.recipientName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {txn.normalizedBankName || txn.rawBankName}
                      {txn.normalizedBankName && txn.rawBankName !== txn.normalizedBankName && (
                        <span className="block text-xs text-gray-400">{txn.rawBankName}</span>
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

      {/* Transaction Detail Drawer */}
      <AnimatePresence>
        {selectedTxn && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setSelectedTxn(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                {/* Drawer header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Transaction Details</h2>
                  <button
                    onClick={() => setSelectedTxn(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3 mb-6">
                  <StatusBadge status={selectedTxn.status} />
                  {selectedTxn.normalizationConfidence != null && (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        selectedTxn.normalizationConfidence >= 0.9
                          ? 'bg-green-100 text-green-800'
                          : selectedTxn.normalizationConfidence >= 0.7
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {(selectedTxn.normalizationConfidence * 100).toFixed(0)}% confidence
                    </span>
                  )}
                </div>

                {/* Details grid */}
                <div className="space-y-4">
                  <DetailRow label="Recipient" value={selectedTxn.recipientName} />
                  <DetailRow label="Amount" value={formatCurrency(selectedTxn.amount)} bold />
                  <DetailRow label="Currency" value={selectedTxn.currency} />
                  <div className="border-t border-gray-100 pt-4">
                    <DetailRow label="Raw Bank Name" value={selectedTxn.rawBankName} />
                    <DetailRow label="Normalized Bank" value={selectedTxn.normalizedBankName || '--'} />
                    {selectedTxn.bank && (
                      <DetailRow label="Bank Code" value={selectedTxn.bank.code} />
                    )}
                    <DetailRow
                      label="Account Number"
                      value={
                        <code className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">
                          {selectedTxn.accountNumber}
                        </code>
                      }
                    />
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <DetailRow label="Transaction ID" value={
                      <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono break-all">
                        {selectedTxn.id}
                      </code>
                    } />
                    <DetailRow label="Batch ID" value={
                      <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono break-all">
                        {selectedTxn.payoutBatchId}
                      </code>
                    } />
                    <DetailRow label="Created" value={formatDate(selectedTxn.createdAt)} />
                    {selectedTxn.processedAt && (
                      <DetailRow label="Processed" value={formatDate(selectedTxn.processedAt)} />
                    )}
                    <DetailRow label="Retry Count" value={String(selectedTxn.retryCount)} />
                  </div>

                  {selectedTxn.failureReason && (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs font-medium text-gray-500 mb-1">Failure Reason</p>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-700">{selectedTxn.failureReason}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Retry confirmation modal */}
      <ConfirmModal
        open={showRetryConfirm}
        title="Retry Failed Transactions?"
        message="This will re-queue all failed transactions in this batch for processing."
        confirmLabel={retrying ? 'Retrying...' : 'Confirm Retry'}
        variant="warning"
        onConfirm={handleRetry}
        onCancel={() => setShowRetryConfirm(false)}
      />

      {/* Cancel confirmation modal */}
      <ConfirmModal
        open={showCancelConfirm}
        title="Cancel This Batch?"
        message="This will cancel all pending transactions in this batch. This action cannot be undone."
        confirmLabel={cancelling ? 'Cancelling...' : 'Confirm Cancel'}
        variant="danger"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelConfirm(false)}
      />

      {/* End recurring confirmation modal */}
      <ConfirmModal
        open={showEndRecurring}
        title="End Recurring Schedule?"
        message="This will stop future recurring payments for this batch. Already processed payments will not be affected."
        confirmLabel={endingRecurring ? 'Ending...' : 'End Recurring'}
        variant="warning"
        onConfirm={handleEndRecurring}
        onCancel={() => setShowEndRecurring(false)}
      />

      {/* Add Recipients Modal */}
      <AnimatePresence>
        {showAddRecipients && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => { setShowAddRecipients(false); setAddFile(null) }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Add Recipients</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Upload a CSV file with additional recipients. Same format as the original upload.
                </p>

                <div
                  onClick={() => document.getElementById('addRecipientsFile')?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all mb-4 ${
                    addFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    id="addRecipientsFile"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) {
                        if (!f.name.endsWith('.csv')) {
                          showToast('error', 'Only .csv files are accepted.')
                          return
                        }
                        setAddFile(f)
                      }
                    }}
                  />
                  {addFile ? (
                    <div>
                      <svg className="w-8 h-8 mx-auto text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium text-gray-900">{addFile.name}</p>
                      <p className="text-xs text-gray-400 mt-1">Click to replace</p>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-gray-600">Click to select CSV file</p>
                      <p className="text-xs text-gray-400 mt-1">name, bank, account_number, amount</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleAddRecipients}
                    disabled={!addFile || addingRecipients}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-forge-primary rounded-lg hover:bg-forge-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {addingRecipients ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </span>
                    ) : 'Upload & Add'}
                  </button>
                  <button
                    onClick={() => { setShowAddRecipients(false); setAddFile(null) }}
                    className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function DetailRow({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between py-1.5">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className={`text-sm text-right ml-4 ${bold ? 'font-semibold text-gray-900' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  )
}
