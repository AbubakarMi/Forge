'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { transactionService } from '@/services/transactionService'
import { payoutBatchService } from '@/services/payoutBatchService'
import { TransactionDetail, TransactionStats, PayoutBatch } from '@/types'
import StatusBadge from '@/components/ui/StatusBadge'
import StatCard from '@/components/ui/StatCard'
import TransactionDetailModal from '@/components/dashboard/TransactionDetailModal'

function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount)
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<TransactionStats | null>(null)
  const [recentBatches, setRecentBatches] = useState<PayoutBatch[]>([])
  const [recentTransactions, setRecentTransactions] = useState<TransactionDetail[]>([])
  const [activeBatchCount, setActiveBatchCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTx, setSelectedTx] = useState<TransactionDetail | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const [statsData, batchesData, txData] = await Promise.all([
          transactionService.getTransactionStats(),
          payoutBatchService.getBatches({ pageSize: 5 }),
          transactionService.getTransactions({ pageSize: 10 }),
        ])

        setStats(statsData)
        setRecentBatches(batchesData.data)
        setRecentTransactions(txData.data)
        setActiveBatchCount(
          batchesData.data.filter((b) => b.status === 'processing' || b.status === 'pending').length
        )
      } catch {
        setError('Failed to load dashboard data. Please refresh.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Overview</h1>
          <p className="text-gray-500 mt-1">Welcome back. Here is a summary of your payout operations.</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/bulk-upload')}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload CSV
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Transactions"
            value={stats.totalTransactions.toLocaleString()}
            color="bg-blue-500"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
          <StatCard
            title="Total Volume"
            value={formatNGN(stats.totalAmount)}
            color="bg-green-500"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Success Rate"
            value={`${stats.successRate.toFixed(1)}%`}
            color="bg-emerald-500"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Active Batches"
            value={activeBatchCount.toString()}
            color="bg-purple-500"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
          />
        </div>
      )}

      {/* Recent Batches */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Batches</h2>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : recentBatches.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-sm">No batches yet. Upload a CSV to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">File Name</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Records</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Amount</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentBatches.map((batch) => (
                  <tr
                    key={batch.id}
                    onClick={() => router.push(`/dashboard/batches/${batch.id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">{batch.fileName}</td>
                    <td className="px-6 py-4 text-gray-600">{batch.totalRecords.toLocaleString()}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{formatNGN(batch.totalAmount)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={batch.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(batch.createdAt).toLocaleDateString('en-US', {
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
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-sm">No transactions yet. Upload a batch to start processing.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Recipient</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Bank</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Amount</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">{tx.recipientName}</td>
                    <td className="px-6 py-4 text-gray-600">{tx.normalizedBankName || tx.rawBankName}</td>
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
      </div>

      {/* Detail Modal */}
      <TransactionDetailModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  )
}
