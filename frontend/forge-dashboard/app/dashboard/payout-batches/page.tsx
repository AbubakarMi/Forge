'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { payoutBatchService } from '@/services/payoutBatchService'
import { PayoutBatch, PaginatedResponse } from '@/types'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import { showToast } from '@/hooks/useToast'

const STATUS_OPTIONS = ['all', 'pending', 'scheduled', 'processing', 'completed', 'partially_failed', 'failed', 'cancelled']

const STATUS_LABELS: Record<string, string> = {
  all: 'All',
  pending: 'Pending',
  scheduled: 'Scheduled',
  processing: 'Processing',
  completed: 'Completed',
  partially_failed: 'Partial',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

export default function PayoutBatchesPage() {
  const router = useRouter()

  const [batches, setBatches] = useState<PayoutBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Filters
  const [status, setStatus] = useState('all')
  const [fileName, setFileName] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const loadBatches = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, pageSize: 10 }
      if (status !== 'all') params.status = status
      if (fileName.trim()) params.fileName = fileName.trim()
      if (fromDate) params.from = fromDate
      if (toDate) params.to = toDate

      const data: PaginatedResponse<PayoutBatch> = await payoutBatchService.getBatches(params)
      setBatches(data?.data ?? [])
      setTotalPages(data?.totalPages ?? 1)
      setTotalCount(data?.totalCount ?? 0)
    } catch {
      showToast('error', 'Failed to load payout batches.')
    } finally {
      setLoading(false)
    }
  }, [page, status, fileName, fromDate, toDate])

  useEffect(() => {
    loadBatches()
  }, [loadBatches])

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

  // Skeleton loader
  if (loading && batches.length === 0) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-12 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payout Batches</h1>
          <p className="text-sm text-gray-500 mt-1">{totalCount} batches total</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/bulk-upload')}
          className="px-4 py-2 text-sm font-medium text-white bg-forge-primary rounded-lg hover:bg-forge-primary/90 transition-colors"
        >
          New Upload
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forge-primary focus:border-transparent"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s] || s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Batch Name</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => { setFileName(e.target.value); setPage(1) }}
              placeholder="Search batch name..."
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forge-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1) }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forge-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1) }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forge-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {batches.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          }
          title="No batches found"
          description="Upload a CSV file to create your first payout batch."
          action={
            <button
              onClick={() => router.push('/dashboard/bulk-upload')}
              className="px-4 py-2 text-sm font-medium text-white bg-forge-primary rounded-lg hover:bg-forge-primary/90 transition-colors"
            >
              Upload CSV
            </button>
          }
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Records</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Success / Failed</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {batches.map((batch) => (
                <tr
                  key={batch.id}
                  onClick={() => router.push(`/dashboard/payout-batches/${batch.id}`)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{batch.batchName || batch.fileName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{batch.totalRecords}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{formatCurrency(batch.totalAmount)}</td>
                  <td className="px-6 py-4">
                    {batch.isRecurring ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        {batch.recurringInterval}
                      </span>
                    ) : batch.paymentType === 'scheduled' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Scheduled
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Immediate</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={batch.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="text-green-600 font-medium">{batch.successCount}</span>
                    {' / '}
                    <span className="text-red-600 font-medium">{batch.failedCount}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(batch.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                  const pageNum = start + i
                  if (pageNum > totalPages) return null
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        pageNum === page
                          ? 'bg-forge-primary text-white'
                          : 'border border-gray-300 hover:bg-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
