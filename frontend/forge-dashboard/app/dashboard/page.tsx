'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { transactionService } from '@/services/transactionService'
import { payoutBatchService } from '@/services/payoutBatchService'
import { TransactionDetail, TransactionStats, PayoutBatch } from '@/types'
import StatusBadge from '@/components/ui/StatusBadge'
import TransactionDetailModal from '@/components/dashboard/TransactionDetailModal'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000_000) return `₦${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(1)}K`
  return `₦${amount}`
}

const STATUS_COLORS: Record<string, string> = {
  Completed: '#10b981',
  Failed: '#ef4444',
  Pending: '#f59e0b',
  Processing: '#6366f1',
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
      <div className="h-3 w-20 bg-gray-200 rounded mb-4" />
      <div className="h-8 w-28 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-16 bg-gray-200 rounded" />
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<TransactionStats | null>(null)
  const [recentBatches, setRecentBatches] = useState<PayoutBatch[]>([])
  const [recentTransactions, setRecentTransactions] = useState<TransactionDetail[]>([])
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
          transactionService.getTransactions({ pageSize: 8 }),
        ])

        setStats(statsData)
        setRecentBatches(batchesData?.data ?? [])
        setRecentTransactions(txData?.data ?? [])
      } catch {
        setError('Failed to load dashboard data. Please refresh.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const totalTx = stats?.totalTransactions ?? 0
  const completedTx = stats?.completedCount ?? 0
  const failedTx = stats?.failedCount ?? 0
  const pendingTx = stats?.pendingCount ?? 0
  const processingTx = stats?.processingCount ?? 0
  const successRate = stats?.successRate ?? 0
  const totalVolume = stats?.totalAmount ?? 0
  const completedVolume = stats?.completedAmount ?? 0

  const activeBatches = recentBatches.filter(
    (b) => b.status === 'processing' || b.status === 'pending'
  ).length

  // Chart data
  const pieData = stats
    ? [
        { name: 'Completed', value: completedTx },
        { name: 'Failed', value: failedTx },
        { name: 'Pending', value: pendingTx + processingTx },
      ].filter((d) => d.value > 0)
    : []

  const barData = [...recentBatches]
    .reverse()
    .map((b) => ({
      name: (b.batchName || b.fileName).length > 10
        ? (b.batchName || b.fileName).slice(0, 10) + '...'
        : (b.batchName || b.fileName),
      total: b.totalAmount,
    }))

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Real-time overview of your payout operations</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/bulk-upload')}
          className="bg-forge-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Payout
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Volume */}
          <div className="col-span-2 lg:col-span-1 bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Volume</span>
            </div>
            <p className="text-xl font-bold text-gray-900 truncate">{formatNGN(totalVolume)}</p>
            <p className="text-xs text-gray-400 mt-1">{formatNGN(completedVolume)} completed</p>
          </div>

          {/* Total Transactions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalTx.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">{activeBatches} active batch{activeBatches !== 1 ? 'es' : ''}</p>
          </div>

          {/* Completed */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completed</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{completedTx.toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${totalTx > 0 ? (completedTx / totalTx) * 100 : 0}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-emerald-600">
                {totalTx > 0 ? ((completedTx / totalTx) * 100).toFixed(0) : 0}%
              </span>
            </div>
          </div>

          {/* Failed */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Failed</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{failedTx.toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${totalTx > 0 ? (failedTx / totalTx) * 100 : 0}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-red-600">
                {totalTx > 0 ? ((failedTx / totalTx) * 100).toFixed(0) : 0}%
              </span>
            </div>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{(pendingTx + processingTx).toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${totalTx > 0 ? ((pendingTx + processingTx) / totalTx) * 100 : 0}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-amber-600">
                {totalTx > 0 ? (((pendingTx + processingTx) / totalTx) * 100).toFixed(0) : 0}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {!loading && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Donut Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Transaction Breakdown</h3>
            <p className="text-xs text-gray-400 mb-4">Distribution by status</p>
            {pieData.length === 0 ? (
              <div className="h-52 flex items-center justify-center">
                <p className="text-gray-400 text-sm">No data yet</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-52 h-52 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [value.toLocaleString(), 'Count']}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-gray-900">{successRate.toFixed(0)}%</span>
                    <span className="text-[10px] text-gray-400 font-medium">Success</span>
                  </div>
                </div>
                <div className="flex items-center gap-5 mt-4">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[entry.name] }}
                      />
                      <span className="text-xs text-gray-500">{entry.name}</span>
                      <span className="text-xs font-bold text-gray-700">{entry.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bar Chart */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Batch Volume</h3>
            <p className="text-xs text-gray-400 mb-4">Recent batch amounts</p>
            {barData.length === 0 ? (
              <div className="h-52 flex items-center justify-center">
                <p className="text-gray-400 text-sm">No batch data yet</p>
              </div>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatCompact(v)}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatNGN(value), 'Volume']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      cursor={{ fill: '#f9fafb' }}
                    />
                    <Bar dataKey="total" fill="#6366f1" radius={[8, 8, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Batches */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Recent Batches</h2>
              <p className="text-xs text-gray-400 mt-0.5">Latest payout batches</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/payout-batches')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              View all
            </button>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : !recentBatches || recentBatches.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">No batches yet</p>
              <p className="text-gray-300 text-xs mt-1">Upload a CSV to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentBatches.map((batch) => (
                <div
                  key={batch.id}
                  onClick={() => router.push(`/dashboard/payout-batches/${batch.id}`)}
                  className="px-6 py-3.5 hover:bg-gray-50/50 transition-colors cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{batch.batchName || batch.fileName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {batch.totalRecords} records &middot; {new Date(batch.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{formatNGN(batch.totalAmount)}</p>
                    <div className="mt-0.5">
                      <StatusBadge status={batch.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Recent Transactions</h2>
              <p className="text-xs text-gray-400 mt-0.5">Latest processed payments</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/transactions')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              View all
            </button>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : !recentTransactions || recentTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">No transactions yet</p>
              <p className="text-gray-300 text-xs mt-1">Upload a batch to start processing</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="px-6 py-3.5 hover:bg-gray-50/50 transition-colors cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{tx.recipientName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {tx.normalizedBankName || tx.rawBankName} &middot; {tx.accountNumber}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{formatNGN(tx.amount)}</p>
                    <div className="mt-0.5">
                      <StatusBadge status={tx.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <TransactionDetailModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  )
}
