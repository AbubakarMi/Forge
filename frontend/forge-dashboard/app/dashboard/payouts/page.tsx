'use client'

import { useState, useEffect, useCallback } from 'react'
import { transactionService } from '@/services/transactionService'
import { TransactionDetail, PaginatedResponse } from '@/types'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import Link from 'next/link'

type StatusFilter = '' | 'completed' | 'failed'

export default function PayoutsPage() {
  const [data, setData] = useState<PaginatedResponse<TransactionDetail> | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)

  const fetchPayouts = useCallback(async () => {
    setLoading(true)
    try {
      // When no specific status filter, we want completed + failed (exclude pending)
      // We'll fetch without status filter and the API should return processed transactions
      // If a specific status is selected, pass it directly
      const result = await transactionService.getTransactions({
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        pageSize: 20,
      })
      setData(result)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, page])

  useEffect(() => {
    fetchPayouts()
  }, [fetchPayouts])

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleStatusChange = (value: StatusFilter) => {
    setStatusFilter(value)
    setPage(1)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const transactions = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  // Filter out pending when "All" is selected (show only completed + failed)
  const displayTransactions = statusFilter
    ? transactions
    : transactions.filter((t) => t.status === 'completed' || t.status === 'failed')

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
        <p className="text-gray-500 mt-1">View processed transactions (completed and failed).</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value as StatusFilter)}
          className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All (Completed + Failed)</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>

        <div className="flex flex-1 gap-2">
          <input
            type="text"
            placeholder="Search by recipient name, account number..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          /* Loading Skeleton */
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-4 bg-gray-100 rounded w-32 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-24 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-28 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-20 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-20 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-24 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-24 animate-pulse" />
              </div>
            ))}
          </div>
        ) : displayTransactions.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="No payouts found"
            description="No processed transactions match your current filters."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left text-gray-500 font-medium px-6 py-3 uppercase tracking-wider text-xs">Recipient</th>
                    <th className="text-left text-gray-500 font-medium px-6 py-3 uppercase tracking-wider text-xs">Bank</th>
                    <th className="text-left text-gray-500 font-medium px-6 py-3 uppercase tracking-wider text-xs">Account No.</th>
                    <th className="text-right text-gray-500 font-medium px-6 py-3 uppercase tracking-wider text-xs">Amount</th>
                    <th className="text-left text-gray-500 font-medium px-6 py-3 uppercase tracking-wider text-xs">Status</th>
                    <th className="text-left text-gray-500 font-medium px-6 py-3 uppercase tracking-wider text-xs">Batch</th>
                    <th className="text-left text-gray-500 font-medium px-6 py-3 uppercase tracking-wider text-xs">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-900 font-medium">
                        {tx.recipientName}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {tx.normalizedBankName || tx.rawBankName}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-gray-700">{tx.accountNumber}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900 font-medium tabular-nums">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/payout-batches/${tx.payoutBatchId}`}
                          className="text-blue-600 hover:text-blue-800 text-xs font-mono hover:underline"
                        >
                          {tx.payoutBatchId.slice(0, 8)}...
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {tx.processedAt
                          ? new Date(tx.processedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : new Date(tx.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages} ({data?.totalCount ?? 0} total)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          pageNum === page
                            ? 'bg-gray-900 text-white'
                            : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
