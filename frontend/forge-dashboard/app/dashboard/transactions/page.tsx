'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { transactionService } from '@/services/transactionService'
import { Transaction } from '@/types'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await transactionService.getTransactions()
        setTransactions(Array.isArray(data) ? data : [])
      } catch {
        setError('Failed to load transactions. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  const statusCounts = transactions.reduce(
    (acc, tx) => {
      const s = tx.status as 'success' | 'pending' | 'failed'
      acc[s] = (acc[s] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
        <p className="text-forge-muted mt-1">View and monitor all API transactions.</p>
      </div>

      {/* Summary Pills */}
      {!loading && transactions.length > 0 && (
        <div className="flex flex-wrap gap-4">
          <div className="bg-forge-surface border border-forge-border rounded-xl px-5 py-2.5 shadow-lg shadow-black/10 text-sm">
            <span className="text-forge-muted font-medium">Total: </span>
            <span className="font-bold text-white ml-1">{transactions.length}</span>
          </div>
          {statusCounts.success && (
            <div className="bg-forge-surface border border-forge-border rounded-xl px-5 py-2.5 shadow-lg shadow-black/10 text-sm">
              <span className="text-forge-muted font-medium">Successful: </span>
              <span className="font-bold text-green-400 ml-1">{statusCounts.success}</span>
            </div>
          )}
          {statusCounts.pending && (
            <div className="bg-forge-surface border border-forge-border rounded-xl px-5 py-2.5 shadow-lg shadow-black/10 text-sm">
              <span className="text-forge-muted font-medium">Pending: </span>
              <span className="font-bold text-forge-accent ml-1">{statusCounts.pending}</span>
            </div>
          )}
          {statusCounts.failed && (
            <div className="bg-forge-surface border border-forge-border rounded-xl px-5 py-2.5 shadow-lg shadow-black/10 text-sm">
              <span className="text-forge-muted font-medium">Failed: </span>
              <span className="font-bold text-red-400 ml-1">{statusCounts.failed}</span>
            </div>
          )}
          <div className="bg-forge-surface border border-forge-border rounded-xl px-5 py-2.5 shadow-lg shadow-black/10 text-sm ml-auto">
            <span className="text-forge-muted font-medium">Total Volume: </span>
            <span className="font-bold text-white ml-1">
              ${transactions.reduce((sum, tx) => sum + tx.amount, 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Transactions Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin w-6 h-6 text-forge-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-forge-background rounded-full flex items-center justify-center mx-auto mb-4 border border-forge-border">
              <svg className="w-8 h-8 text-forge-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-white font-medium mb-1">No transactions yet</p>
            <p className="text-forge-muted text-sm">Transactions will appear here once your API is active.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-forge-border">
                  <th className="text-left text-forge-muted font-medium pb-4 pr-4 uppercase tracking-wider text-[11px]">Transaction ID</th>
                  <th className="text-left text-forge-muted font-medium pb-4 pr-4 uppercase tracking-wider text-[11px]">Amount</th>
                  <th className="text-left text-forge-muted font-medium pb-4 pr-4 uppercase tracking-wider text-[11px]">Currency</th>
                  <th className="text-left text-forge-muted font-medium pb-4 pr-4 uppercase tracking-wider text-[11px]">Status</th>
                  <th className="text-left text-forge-muted font-medium pb-4 uppercase tracking-wider text-[11px]">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forge-border/50">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-4 pr-4">
                      <span className="font-mono text-xs bg-forge-background text-white px-3 py-1.5 rounded border border-forge-border group-hover:border-forge-primary/30 transition-colors">
                        {tx.id.length > 16 ? `${tx.id.slice(0, 8)}...${tx.id.slice(-4)}` : tx.id}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="font-bold text-white">${tx.amount.toFixed(2)}</span>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="text-forge-muted uppercase font-semibold text-[11px] tracking-widest group-hover:text-forge-text transition-colors">
                        {tx.currency}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <Badge status={tx.status as 'success' | 'pending' | 'failed'} />
                    </td>
                    <td className="py-4 text-forge-muted group-hover:text-forge-text transition-colors font-medium">
                      {new Date(tx.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
