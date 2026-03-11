'use client'

import { useState, useCallback } from 'react'
import { reportService, SummaryReport } from '@/services/reportService'
import { showToast } from '@/hooks/useToast'

function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount)
}

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [report, setReport] = useState<SummaryReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const generateReport = useCallback(async () => {
    setLoading(true)
    try {
      const data = await reportService.getSummaryReport(
        dateFrom || undefined,
        dateTo || undefined
      )
      setReport(data)
    } catch {
      showToast('error', 'Failed to generate report.')
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  const handleExportTransactions = async () => {
    setExporting(true)
    try {
      await reportService.exportTransactions({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      showToast('success', 'Transactions exported successfully.')
    } catch {
      showToast('error', 'Failed to export transactions.')
    } finally {
      setExporting(false)
    }
  }

  const handleExportAll = async () => {
    setExporting(true)
    try {
      await reportService.exportTransactions({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      showToast('success', 'Export completed successfully.')
    } catch {
      showToast('error', 'Failed to export data.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 mt-1">Generate and export summary reports for your payout activity.</p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={generateReport}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-forge-primary rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          <div className="ml-auto flex gap-2">
            <button
              onClick={handleExportTransactions}
              disabled={exporting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Export Transactions CSV
            </button>
            <button
              onClick={handleExportAll}
              disabled={exporting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Export All CSV
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                <div className="h-8 bg-gray-200 rounded w-32" />
              </div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-xl" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      )}

      {/* Report Content */}
      {!loading && report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-sm text-gray-500 font-medium">Total Batches</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{report.totalBatches.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-sm text-gray-500 font-medium">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{report.totalTransactions.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-sm text-gray-500 font-medium">Total Volume</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatNGN(report.totalVolume)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-sm text-gray-500 font-medium">Success Rate</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{report.successRate.toFixed(1)}%</p>
            </div>
          </div>

          {/* Top Banks Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Top Banks</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Bank Name</th>
                    <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Transaction Count</th>
                    <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Total Amount</th>
                    <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Success Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.topBanks.slice(0, 10).map((bank, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{bank.bankName}</td>
                      <td className="px-6 py-4 text-gray-600">{bank.transactionCount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium">{formatNGN(bank.totalAmount)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          bank.successRate >= 90
                            ? 'bg-green-100 text-green-800'
                            : bank.successRate >= 70
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {bank.successRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {report.topBanks.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-400">
                        No bank data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Breakdown Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Daily Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Date</th>
                    <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Transactions</th>
                    <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Amount</th>
                    <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Success</th>
                    <th className="text-left text-gray-500 font-medium px-6 py-3 text-xs uppercase tracking-wider">Failed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.dailyBreakdown.map((day, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {new Date(day.date).toLocaleDateString('en-NG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{day.transactionCount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium">{formatNGN(day.amount)}</td>
                      <td className="px-6 py-4 text-green-600 font-medium">{day.successCount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-red-600 font-medium">{day.failedCount.toLocaleString()}</td>
                    </tr>
                  ))}
                  {report.dailyBreakdown.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                        No daily data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Empty state when no report generated yet */}
      {!loading && !report && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 text-sm">Select a date range and click &quot;Generate Report&quot; to view summary data.</p>
        </div>
      )}
    </div>
  )
}
