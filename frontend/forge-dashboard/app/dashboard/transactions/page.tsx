'use client'

import { useEffect, useState, useCallback } from 'react'
import { transactionService } from '@/services/transactionService'
import { reportService } from '@/services/reportService'
import { showToast } from '@/hooks/useToast'
import { TransactionDetail, TransactionStats, PaginatedResponse } from '@/types'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import TransactionDetailModal from '@/components/dashboard/TransactionDetailModal'

function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount)
}

const SKELETON_WIDTHS = ['75%', '65%', '55%', '70%', '50%', '60%']

function SkeletonRow() {
  return (
    <tr>
      {SKELETON_WIDTHS.map((w, i) => (
        <td key={i} className="py-4 pr-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<PaginatedResponse<TransactionDetail> | null>(null)
  const [stats, setStats] = useState<TransactionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTx, setSelectedTx] = useState<TransactionDetail | null>(null)

  // Filters
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [exportingCsv, setExportingCsv] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [txData, statsData] = await Promise.all([
        transactionService.getTransactions({
          status: status || undefined,
          search: search || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          page,
          pageSize: 20,
        }),
        transactionService.getTransactionStats(),
      ])
      setTransactions(txData)
      setStats(statsData)
    } catch {
      setError('Failed to load transactions. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [status, search, dateFrom, dateTo, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Debounced search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleStatusChange = (val: string) => {
    setStatus(val)
    setPage(1)
  }

  const handleExportCsv = async () => {
    setExportingCsv(true)
    try {
      await reportService.exportTransactions({
        status: status || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      showToast('success', 'Transactions exported successfully.')
    } catch {
      showToast('error', 'Failed to export transactions.')
    } finally {
      setExportingCsv(false)
    }
  }

  const txList = transactions?.data || []
  const totalPages = transactions?.totalPages || 1
  const totalCount = transactions?.totalCount || 0

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 mt-1">View and monitor all payout transactions.</p>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={exportingCsv}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {exportingCsv ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Stats Summary Row */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm text-gray-500 font-medium">Total Transactions</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalTransactions.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm text-gray-500 font-medium">Total Volume</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatNGN(stats.totalAmount)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm text-gray-500 font-medium">Success Rate</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.successRate.toFixed(1)}%</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm text-gray-500 font-medium">Failed</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.failedCount.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Status */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex flex-col flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-gray-500 mb-1">Search</label>
            <input
              type="text"
              placeholder="Recipient name, bank, account..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Date From */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Transaction Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Recipient</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Bank</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Account</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Amount</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : txList.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            title="No transactions found"
            description="No transactions match your current filters. Try adjusting the filters or upload a new batch."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Recipient</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Bank</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Account</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Amount</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {txList.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">{tx.recipientName}</td>
                    <td className="px-6 py-4 text-gray-600">
                      <span>{tx.rawBankName}</span>
                      <span className="mx-1 text-gray-400">&rarr;</span>
                      <span className={tx.normalizedBankName ? 'text-gray-900 font-medium' : 'text-gray-400 italic'}>
                        {tx.normalizedBankName || 'No match'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-600 text-xs">{tx.accountNumber}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{formatNGN(tx.amount)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(tx.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && txList.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages} ({totalCount.toLocaleString()} total)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1.5 text-sm rounded-lg ${
                      page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <TransactionDetailModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  )
}
