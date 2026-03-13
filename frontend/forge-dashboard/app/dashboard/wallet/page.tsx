'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { walletService, WalletBalance, WalletTransaction } from '@/services/walletService'
import { showToast } from '@/hooks/useToast'

type TypeFilter = 'all' | 'credit' | 'debit' | 'refund'

export default function WalletPage() {
  const [balance, setBalance] = useState<WalletBalance | null>(null)
  const [history, setHistory] = useState<WalletTransaction[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  // Fund modal
  const [showFund, setShowFund] = useState(false)
  const [fundAmount, setFundAmount] = useState('')
  const [funding, setFunding] = useState(false)

  const pageSize = 15

  const loadData = useCallback(async () => {
    try {
      const [bal, hist] = await Promise.all([
        walletService.getBalance(),
        walletService.getHistory({
          page,
          pageSize,
          type: typeFilter === 'all' ? undefined : typeFilter,
        }),
      ])
      setBalance(bal)
      setHistory(hist.data)
      setTotalCount(hist.totalCount)
    } catch {
      showToast('error', 'Failed to load wallet data.')
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleFund = async () => {
    const amount = parseFloat(fundAmount)
    if (isNaN(amount) || amount <= 0) {
      showToast('error', 'Enter a valid amount.')
      return
    }
    setFunding(true)
    try {
      await walletService.fundWallet(amount)
      showToast('success', `Wallet funded with ${formatCurrency(amount)}.`)
      setShowFund(false)
      setFundAmount('')
      await loadData()
    } catch {
      showToast('error', 'Failed to fund wallet.')
    } finally {
      setFunding(false)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  const totalPages = Math.ceil(totalCount / pageSize)

  const typeColors: Record<string, { bg: string; text: string; label: string }> = {
    credit: { bg: 'bg-green-50', text: 'text-green-700', label: 'Credit' },
    debit: { bg: 'bg-red-50', text: 'text-red-700', label: 'Debit' },
    refund: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Refund' },
    fee: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Fee' },
  }

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto animate-pulse space-y-6">
        <div className="h-8 w-32 bg-gray-200 rounded-lg" />
        <div className="h-40 bg-gray-100 rounded-2xl" />
        <div className="h-96 bg-gray-100 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your organization balance</p>
        </div>
        <button
          onClick={() => setShowFund(true)}
          className="bg-forge-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-forge-primary/90 transition-all shadow-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Fund Wallet
        </button>
      </div>

      {/* Balance Card */}
      {balance && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 p-8"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Available Balance</p>
              <p className="text-4xl font-extrabold text-gray-900 tracking-tight">
                {formatCurrency(balance.balance)}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Last updated {formatDate(balance.updatedAt)}
              </p>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
              balance.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {balance.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </motion.div>
      )}

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Transaction History</h2>
            <p className="text-xs text-gray-400 mt-0.5">{totalCount} total entries</p>
          </div>
          <div className="flex items-center gap-1">
            {(['all', 'credit', 'debit', 'refund'] as TypeFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTypeFilter(t); setPage(1) }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  typeFilter === t
                    ? 'bg-forge-primary text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {history.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-medium">No transactions yet</p>
            <p className="text-gray-300 text-xs mt-1">Fund your wallet to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance After</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.map((tx) => {
                  const tc = typeColors[tx.type] ?? { bg: 'bg-gray-50', text: 'text-gray-700', label: tx.type }
                  const isPositive = tx.type === 'credit' || tx.type === 'refund'
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${tc.bg} ${tc.text}`}>
                          {tc.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm text-gray-900 truncate max-w-xs">{tx.description}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{tx.reference}</p>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span className={`text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositive ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span className="text-sm text-gray-700">{formatCurrency(tx.balanceAfter)}</span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span className="text-xs text-gray-400">{formatDate(tx.createdAt)}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-medium text-gray-500 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs font-medium text-gray-500 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Fund Wallet Modal */}
      <AnimatePresence>
        {showFund && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => { setShowFund(false); setFundAmount('') }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Fund Wallet</h2>
                <p className="text-sm text-gray-500 mb-5">
                  Add funds to your organization wallet.
                </p>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (NGN)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₦</span>
                    <input
                      type="number"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      placeholder="0.00"
                      min="1"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg text-lg font-semibold text-gray-900 focus:ring-2 focus:ring-forge-primary focus:border-transparent"
                    />
                  </div>
                  {balance && (
                    <p className="text-xs text-gray-400 mt-2">
                      Current balance: {formatCurrency(balance.balance)}
                    </p>
                  )}
                </div>

                {/* Quick amounts */}
                <div className="flex gap-2 mb-5">
                  {[100000, 500000, 1000000, 5000000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setFundAmount(String(amt))}
                      className="flex-1 px-2 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}K`}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleFund}
                    disabled={funding || !fundAmount || parseFloat(fundAmount) <= 0}
                    className="flex-1 px-5 py-3 text-sm font-semibold text-white bg-forge-primary rounded-lg hover:bg-forge-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {funding ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : 'Fund Wallet'}
                  </button>
                  <button
                    onClick={() => { setShowFund(false); setFundAmount('') }}
                    className="px-5 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
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
