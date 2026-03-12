'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { transactionService } from '@/services/transactionService'
import { payoutBatchService } from '@/services/payoutBatchService'
import { TransactionDetail, TransactionStats, PayoutBatch } from '@/types'
import StatusBadge from '@/components/ui/StatusBadge'
import TransactionDetailModal from '@/components/dashboard/TransactionDetailModal'

function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`
  return String(amount)
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
          payoutBatchService.getBatches({ pageSize: 6 }),
          transactionService.getTransactions({ pageSize: 10 }),
        ])
        setStats(statsData)
        setRecentBatches(batchesData?.data ?? [])
        setRecentTransactions(txData?.data ?? [])
      } catch {
        setError('Failed to load dashboard data.')
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

  const scheduledBatches = recentBatches.filter(
    (b) => b.status === 'scheduled'
  ).length

  // Donut chart segments
  const donutSegments = useMemo(() => {
    if (!stats || totalTx === 0) return []
    const segments = [
      { label: 'Completed', value: completedTx, color: '#10b981' },
      { label: 'Failed', value: failedTx, color: '#ef4444' },
      { label: 'Pending', value: pendingTx + processingTx, color: '#f59e0b' },
    ].filter(s => s.value > 0)

    let cumulative = 0
    return segments.map(s => {
      const pct = (s.value / totalTx) * 100
      const offset = cumulative
      cumulative += pct
      return { ...s, pct, offset }
    })
  }, [stats, totalTx, completedTx, failedTx, pendingTx, processingTx])

  // Bar chart for batch volumes
  const batchBars = useMemo(() => {
    const reversed = [...recentBatches].reverse().slice(0, 6)
    if (reversed.length === 0) return []
    const max = Math.max(...reversed.map(b => b.totalAmount), 1)
    return reversed.map(b => ({
      id: b.id,
      name: (b.batchName || b.fileName).length > 12
        ? (b.batchName || b.fileName).slice(0, 12) + '...'
        : (b.batchName || b.fileName),
      amount: b.totalAmount,
      pct: (b.totalAmount / max) * 100,
      status: b.status,
    }))
  }, [recentBatches])

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-gray-100 rounded-2xl" />
          <div className="lg:col-span-2 h-80 bg-gray-100 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-gray-100 rounded-2xl" />
          <div className="h-72 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/bulk-upload')}
          className="bg-forge-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-forge-primary/90 transition-all shadow-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Payout
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Stat Cards - 4 column grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Payout Volume */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-white rounded-2xl border border-gray-100 p-5 relative overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs font-medium text-gray-500 mb-1">Total Payout Volume</p>
          <p className="text-xl font-extrabold text-gray-900 tracking-tight">{formatNGN(totalVolume)}</p>
          <p className="text-xs text-gray-400 mt-1.5">{formatNGN(completedVolume)} successfully paid out</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500/10">
            <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: totalVolume > 0 ? `${Math.min((completedVolume / totalVolume) * 100, 100)}%` : '0%' }} />
          </div>
        </motion.div>

        {/* Total Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-gray-100 p-5 relative overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-xs font-medium text-gray-500 mb-1">Total Transactions</p>
          <p className="text-2xl font-extrabold text-gray-900">{totalTx.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1.5">
            {activeBatches > 0 && <>{activeBatches} batch{activeBatches !== 1 ? 'es' : ''} in progress</>}
            {activeBatches > 0 && scheduledBatches > 0 && ', '}
            {scheduledBatches > 0 && <>{scheduledBatches} scheduled</>}
            {activeBatches === 0 && scheduledBatches === 0 && 'across all batches'}
          </p>
        </motion.div>

        {/* Successful Payments */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 p-5 relative overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs font-medium text-gray-500 mb-1">Successful Payments</p>
          <p className="text-2xl font-extrabold text-emerald-600">{completedTx.toLocaleString()}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${successRate}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs font-bold text-emerald-600">{successRate.toFixed(1)}%</span>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">{completedTx.toLocaleString()} of {totalTx.toLocaleString()} completed</p>
        </motion.div>

        {/* Failed & Pending */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-gray-100 p-5 relative overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <p className="text-xs font-medium text-gray-500 mb-1">Failed Transactions</p>
          <p className="text-2xl font-extrabold text-red-600">{failedTx.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1.5">
            {(pendingTx + processingTx).toLocaleString()} still pending
            {failedTx > 0 && totalTx > 0 && <> &middot; {((failedTx / totalTx) * 100).toFixed(1)}% failure rate</>}
          </p>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-100 p-6"
        >
          <h3 className="text-sm font-semibold text-gray-900">Payment Status Breakdown</h3>
          <p className="text-xs text-gray-400 mt-0.5 mb-5">How your transactions are distributed</p>

          {totalTx === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400">No data yet</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {/* SVG Donut */}
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="48" fill="none" stroke="#f3f4f6" strokeWidth="14" />
                  {donutSegments.map((seg, i) => (
                    <motion.circle
                      key={seg.label}
                      cx="60"
                      cy="60"
                      r="48"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="14"
                      strokeLinecap="round"
                      strokeDasharray={`${(seg.pct / 100) * 301.59} 301.59`}
                      strokeDashoffset={`${-(seg.offset / 100) * 301.59}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-gray-900">{successRate.toFixed(0)}%</span>
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Success Rate</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-col gap-2 mt-5 w-full">
                {donutSegments.map((seg) => (
                  <div key={seg.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                      <span className="text-xs font-medium text-gray-600">{seg.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{seg.value.toLocaleString()}</span>
                      <span className="text-[10px] text-gray-400 w-8 text-right">{seg.pct.toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Recent Batch Payouts</h3>
              <p className="text-xs text-gray-400 mt-0.5">Amount per batch</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/payout-batches')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              View all
            </button>
          </div>

          {batchBars.length === 0 ? (
            <div className="h-52 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400">No batch data yet</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {batchBars.map((bar, i) => (
                <motion.div
                  key={bar.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  onClick={() => router.push(`/dashboard/payout-batches/${bar.id}`)}
                  className="group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700 group-hover:text-indigo-600 transition-colors truncate max-w-[60%]">
                      {bar.name}
                    </span>
                    <span className="text-xs font-bold text-gray-900">{formatNGN(bar.amount)}</span>
                  </div>
                  <div className="h-7 bg-gray-50 rounded-lg overflow-hidden relative">
                    <motion.div
                      className="h-full rounded-lg bg-indigo-100 group-hover:bg-indigo-200 transition-colors relative"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(bar.pct, 3)}%` }}
                      transition={{ duration: 0.6, delay: 0.3 + i * 0.05, ease: 'easeOut' }}
                    >
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <StatusBadge status={bar.status} />
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Activity Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Batches */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Recent Batches</h2>
              <p className="text-xs text-gray-400 mt-0.5">{recentBatches.length} latest</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/payout-batches')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
            >
              View all
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {!recentBatches || recentBatches.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm font-medium">No batches yet</p>
              <p className="text-gray-300 text-xs mt-1">Upload a CSV to get started</p>
            </div>
          ) : (
            <div>
              {recentBatches.map((batch, i) => (
                <div
                  key={batch.id}
                  onClick={() => router.push(`/dashboard/payout-batches/${batch.id}`)}
                  className="px-6 py-3.5 hover:bg-gray-50/80 transition-colors cursor-pointer flex items-center gap-4 border-b border-gray-50 last:border-0"
                >
                  {/* Batch icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    batch.status === 'completed' ? 'bg-emerald-50' :
                    batch.status === 'failed' ? 'bg-red-50' :
                    batch.status === 'scheduled' ? 'bg-indigo-50' :
                    batch.isRecurring ? 'bg-purple-50' :
                    'bg-blue-50'
                  }`}>
                    {batch.isRecurring ? (
                      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : batch.status === 'completed' ? (
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : batch.status === 'failed' ? (
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : batch.status === 'scheduled' ? (
                      <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{batch.batchName || batch.fileName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{batch.totalRecords} records</span>
                      {batch.isRecurring && (
                        <span className="text-[10px] font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{batch.recurringInterval}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{formatNGN(batch.totalAmount)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(batch.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Recent Transactions</h2>
              <p className="text-xs text-gray-400 mt-0.5">Latest payments</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/transactions')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
            >
              View all
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {!recentTransactions || recentTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm font-medium">No transactions yet</p>
              <p className="text-gray-300 text-xs mt-1">Upload a batch to start processing</p>
            </div>
          ) : (
            <div>
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="px-6 py-3 hover:bg-gray-50/80 transition-colors cursor-pointer flex items-center gap-4 border-b border-gray-50 last:border-0"
                >
                  {/* Status indicator dot */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    tx.status === 'completed' ? 'bg-emerald-500' :
                    tx.status === 'failed' ? 'bg-red-500' :
                    tx.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                    'bg-amber-400'
                  }`} />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{tx.recipientName}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {tx.normalizedBankName || tx.rawBankName}
                      <span className="mx-1 text-gray-300">&middot;</span>
                      <span className="font-mono">{tx.accountNumber}</span>
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-semibold ${
                      tx.status === 'failed' ? 'text-red-600' : 'text-gray-900'
                    }`}>{formatNGN(tx.amount)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(tx.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {[
          {
            label: 'Bulk Upload',
            desc: 'Upload a CSV to send payments',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            ),
            href: '/dashboard/bulk-upload',
            color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100',
          },
          {
            label: 'Payout Batches',
            desc: 'Manage all your payout batches',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            ),
            href: '/dashboard/payout-batches',
            color: 'text-blue-600 bg-blue-50 hover:bg-blue-100',
          },
          {
            label: 'Transactions',
            desc: 'View individual payment details',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ),
            href: '/dashboard/transactions',
            color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100',
          },
          {
            label: 'Audit Logs',
            desc: 'Review all account activity',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ),
            href: '/dashboard/audit-logs',
            color: 'text-gray-600 bg-gray-50 hover:bg-gray-100',
          },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => router.push(action.href)}
            className={`flex items-center gap-3 p-4 rounded-xl border border-gray-100 transition-all ${action.color}`}
          >
            <div className="flex-shrink-0">{action.icon}</div>
            <div className="text-left">
              <p className="text-sm font-semibold">{action.label}</p>
              <p className="text-[10px] opacity-60">{action.desc}</p>
            </div>
          </button>
        ))}
      </motion.div>

      <TransactionDetailModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  )
}
