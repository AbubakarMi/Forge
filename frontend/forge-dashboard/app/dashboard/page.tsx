'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import { transactionService } from '@/services/transactionService'
import { apiKeyService } from '@/services/apiKeyService'
import { payoutService } from '@/services/payoutService'
import { Transaction, ApiKey, Payout } from '@/types'
import Badge from '@/components/ui/Badge'

interface SummaryStats {
  totalTransactions: number
  activeApiKeys: number
  pendingPayouts: number
  totalVolume: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<SummaryStats>({
    totalTransactions: 0,
    activeApiKeys: 0,
    pendingPayouts: 0,
    totalVolume: 0,
  })
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const [transactions, keys, payouts] = await Promise.all([
          transactionService.getTransactions(),
          apiKeyService.getKeys(),
          payoutService.getPayouts(),
        ])

        const txList: Transaction[] = Array.isArray(transactions) ? transactions : []
        const keyList: ApiKey[] = Array.isArray(keys) ? keys : []
        const payoutList: Payout[] = Array.isArray(payouts) ? payouts : []

        const totalVolume = txList.reduce((sum, tx) => sum + (tx.amount || 0), 0)

        setStats({
          totalTransactions: txList.length,
          activeApiKeys: keyList.filter((k) => !k.isRevoked).length,
          pendingPayouts: payoutList.filter((p) => p.status === 'pending').length,
          totalVolume,
        })
        setRecentTransactions(txList.slice(0, 5))
      } catch {
        setError('Failed to load dashboard data. Please refresh.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const summaryCards = [
    {
      label: 'Total Transactions',
      value: loading ? '—' : stats.totalTransactions.toString(),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: 'bg-forge-primary',
      bg: 'bg-forge-primary/10',
      text: 'text-forge-primary',
    },
    {
      label: 'Active API Keys',
      value: loading ? '—' : stats.activeApiKeys.toString(),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      color: 'bg-green-500',
      bg: 'bg-green-500/10',
      text: 'text-green-400',
    },
    {
      label: 'Pending Payouts',
      value: loading ? '—' : stats.pendingPayouts.toString(),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-forge-accent',
      bg: 'bg-forge-accent/10',
      text: 'text-forge-accent',
    },
    {
      label: 'Total Volume',
      value: loading ? '—' : `$${stats.totalVolume.toFixed(2)}`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'bg-forge-secondary',
      bg: 'bg-forge-secondary/10',
      text: 'text-forge-secondary',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-forge-muted mt-1">Welcome back. Here&apos;s what&apos;s happening with your API.</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <Card key={i}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-forge-muted font-medium">{card.label}</p>
                <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
              </div>
              <div className={`${card.bg} ${card.text} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-110`}>
                {card.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Transactions */}
      <Card title="Recent Transactions">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin w-6 h-6 text-forge-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-forge-surface mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-forge-muted text-sm">No transactions yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-forge-border">
                  <th className="text-left text-forge-muted font-medium pb-3 pr-4">ID</th>
                  <th className="text-left text-forge-muted font-medium pb-3 pr-4">Amount</th>
                  <th className="text-left text-forge-muted font-medium pb-3 pr-4">Currency</th>
                  <th className="text-left text-forge-muted font-medium pb-3 pr-4">Status</th>
                  <th className="text-left text-forge-muted font-medium pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forge-border/50">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-3 pr-4 font-mono text-forge-muted group-hover:text-forge-text transition-colors">
                      {tx.id.length > 12 ? `${tx.id.slice(0, 8)}...` : tx.id}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-white">
                      ${tx.amount.toFixed(2)}
                    </td>
                    <td className="py-3 pr-4 text-forge-muted uppercase group-hover:text-forge-text transition-colors">{tx.currency}</td>
                    <td className="py-3 pr-4">
                      <Badge status={tx.status as 'success' | 'pending' | 'failed'} />
                    </td>
                    <td className="py-3 text-forge-muted group-hover:text-forge-text transition-colors">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
