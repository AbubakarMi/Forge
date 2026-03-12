'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { payoutBatchService, CreateBatchResponse, BatchSummary } from '@/services/payoutBatchService'
import { PayoutBatchDetail, TransactionDetail } from '@/types'
import StatusBadge from '@/components/ui/StatusBadge'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { showToast } from '@/hooks/useToast'

type Step = 'upload' | 'normalizing' | 'review' | 'processing'

export default function BulkUploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadResult, setUploadResult] = useState<CreateBatchResponse | null>(null)

  // Batch detail (fetched after upload for full transaction data)
  const [batchDetail, setBatchDetail] = useState<PayoutBatchDetail | null>(null)

  // Normalizing step
  const [normProgress, setNormProgress] = useState(0)
  const [normStage, setNormStage] = useState('')

  // Processing step
  const [processingDetail, setProcessingDetail] = useState<PayoutBatchDetail | null>(null)
  const [summary, setSummary] = useState<BatchSummary | null>(null)
  const [processingInBackground, setProcessingInBackground] = useState(false)

  // Duplicate confirmation
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false)
  const [confirmingDuplicates, setConfirmingDuplicates] = useState(false)

  const MAX_SIZE = 10 * 1024 * 1024

  const handleFile = useCallback((f: File) => {
    if (!f.name.endsWith('.csv')) {
      showToast('error', 'Only .csv files are accepted.')
      return
    }
    if (f.size > MAX_SIZE) {
      showToast('error', 'File size must be under 10MB.')
      return
    }
    setFile(f)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const f = e.dataTransfer.files[0]
      if (f) handleFile(f)
    },
    [handleFile]
  )

  const handleUpload = async () => {
    if (!file) return
    setStep('normalizing')
    setNormProgress(0)
    setNormStage('Parsing CSV file...')

    const stages = [
      { at: 10, label: 'Parsing CSV file...' },
      { at: 30, label: 'Normalizing bank names...' },
      { at: 55, label: 'Validating account numbers...' },
      { at: 75, label: 'Checking for duplicates...' },
      { at: 90, label: 'Finalizing batch...' },
    ]

    let currentProgress = 0
    const progressInterval = setInterval(() => {
      currentProgress += Math.random() * 3 + 1
      if (currentProgress > 95) currentProgress = 95
      setNormProgress(Math.round(currentProgress))
      const stage = [...stages].reverse().find(s => currentProgress >= s.at)
      if (stage) setNormStage(stage.label)
    }, 200)

    try {
      const data = await payoutBatchService.uploadBatch(file)
      clearInterval(progressInterval)
      setNormProgress(100)
      setNormStage('Complete!')
      setUploadResult(data)

      // Fetch full batch detail to get transaction-level data for review
      const detail = await payoutBatchService.getBatchDetail(data.batchId)
      setBatchDetail(detail)

      setTimeout(() => setStep('review'), 600)
    } catch {
      clearInterval(progressInterval)
      setStep('upload')
      showToast('error', 'Upload failed. Please try again.')
    }
  }

  // Categorize failed transactions
  const failedTransactions = useMemo(() => {
    if (!batchDetail) return { duplicates: [], nuban: [], other: [], all: [] }
    const failed = batchDetail.transactions.filter(t => t.status === 'failed')
    const duplicates = failed.filter(t => t.failureReason?.toLowerCase().includes('duplicate'))
    const nuban = failed.filter(t =>
      t.failureReason?.toLowerCase().includes('nuban') ||
      t.failureReason?.toLowerCase().includes('account number')
    ).filter(t => !t.failureReason?.toLowerCase().includes('duplicate'))
    const other = failed.filter(t =>
      !t.failureReason?.toLowerCase().includes('duplicate') &&
      !t.failureReason?.toLowerCase().includes('nuban') &&
      !t.failureReason?.toLowerCase().includes('account number')
    )
    return { duplicates, nuban, other, all: failed }
  }, [batchDetail])

  // Poll batch detail during processing step
  useEffect(() => {
    if (step !== 'processing' || !uploadResult?.batchId || processingInBackground) return
    let cancelled = false
    const poll = async () => {
      try {
        const [detail, sum] = await Promise.all([
          payoutBatchService.getBatchDetail(uploadResult.batchId),
          payoutBatchService.getBatchSummary(uploadResult.batchId).catch(() => null),
        ])
        if (cancelled) return
        setProcessingDetail(detail)
        setSummary(sum)
        if (['completed', 'partially_failed', 'failed'].includes(detail.status)) return
      } catch { /* ignore */ }
      if (!cancelled) setTimeout(poll, 2000)
    }
    poll()
    return () => { cancelled = true }
  }, [step, uploadResult?.batchId, processingInBackground])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount)

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleDownloadTemplate = () => {
    const csvContent = [
      'name,bank,account_number,amount',
      'Abubakar Mohammed,Access Bank,0123456789,50000',
      'Fatima Ibrahim,GTB,0234567890,75000',
      'Chinedu Okafor,First Bank,1234567890,25000',
      'Amina Yusuf,UBA,2345678901,100000',
      'Emeka Nwosu,Zenith Bank,3456789012,35000',
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'forge-payout-template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadFailed = () => {
    if (failedTransactions.all.length === 0) return
    const escape = (s: string) => `"${(s || '').replace(/"/g, '""')}"`
    const rows = [
      'name,bank,account_number,amount,failure_reason',
      ...failedTransactions.all.map((t) =>
        [
          escape(t.recipientName),
          escape(t.rawBankName),
          t.accountNumber,
          t.amount,
          escape(t.failureReason || ''),
        ].join(',')
      ),
    ].join('\n')
    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `failed-records-${uploadResult?.batchId?.slice(0, 8) || 'batch'}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleConfirmDuplicates = async () => {
    if (!uploadResult) return
    setConfirmingDuplicates(true)
    try {
      const result = await payoutBatchService.confirmDuplicates(uploadResult.batchId)
      showToast('success', `${result.confirmedCount} transaction(s) confirmed and re-queued for processing.`)
      setShowDuplicateConfirm(false)
      // Refresh batch detail
      const detail = await payoutBatchService.getBatchDetail(uploadResult.batchId)
      setBatchDetail(detail)
    } catch {
      showToast('error', 'Failed to confirm duplicates.')
    } finally {
      setConfirmingDuplicates(false)
    }
  }

  const handleProceedToPayment = () => {
    setStep('processing')
    setProcessingDetail(null)
    setSummary(null)
    setProcessingInBackground(false)
  }

  const handlePayInBackground = () => {
    setProcessingInBackground(true)
    showToast('success', 'Batch is processing in the background.')
    router.push('/dashboard/payout-batches')
  }

  const handleReset = () => {
    setStep('upload')
    setFile(null)
    setUploadResult(null)
    setBatchDetail(null)
    setProcessingDetail(null)
    setSummary(null)
    setNormProgress(0)
  }

  const stepLabels: { key: Step; label: string }[] = [
    { key: 'upload', label: 'Upload' },
    { key: 'normalizing', label: 'Normalize' },
    { key: 'review', label: 'Review' },
    { key: 'processing', label: 'Payment' },
  ]
  const stepIndex = stepLabels.findIndex(s => s.key === step)

  const batchDone = processingDetail && ['completed', 'partially_failed', 'failed'].includes(processingDetail.status)
  const processed = processingDetail ? (processingDetail.successCount + processingDetail.failedCount) : 0
  const total = processingDetail?.totalRecords ?? uploadResult?.totalRecords ?? 0
  const validCount = batchDetail?.transactions.filter(t => t.status === 'pending').length ?? uploadResult?.validRecords ?? 0

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bulk Upload</h1>
        <p className="text-sm text-gray-500 mt-1">Upload a CSV file to create and process a payout batch</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {stepLabels.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i === stepIndex ? 'bg-forge-primary text-white'
                  : i < stepIndex ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {i < stepIndex ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:inline ${
                i === stepIndex ? 'text-gray-900' : i < stepIndex ? 'text-green-600' : 'text-gray-400'
              }`}>{s.label}</span>
            </div>
            {i < stepLabels.length - 1 && <div className="w-8 h-0.5 bg-gray-200" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Upload ── */}
        {step === 'upload' && (
          <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                dragOver ? 'border-forge-primary bg-forge-primary/5'
                  : file ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400 bg-white'
              }`}
            >
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              {file ? (
                <div>
                  <svg className="w-12 h-12 mx-auto text-green-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatSize(file.size)}</p>
                  <p className="text-xs text-gray-400 mt-2">Click or drag to replace</p>
                </div>
              ) : (
                <div>
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm font-semibold text-gray-700">Drag and drop your CSV file here</p>
                  <p className="text-xs text-gray-400 mt-1">or click to browse</p>
                  <p className="text-xs text-gray-400 mt-3">CSV only, max 10MB</p>
                </div>
              )}
            </div>

            {/* CSV Format Guide */}
            <div className="mt-4 bg-gray-50 rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Required CSV Columns</p>
                <button onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-forge-primary bg-white border border-forge-primary/30 rounded-lg hover:bg-forge-primary hover:text-white transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download CSV Template
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { col: 'name', desc: 'Recipient full name' },
                  { col: 'bank', desc: 'Bank name (e.g. GTB, UBA)' },
                  { col: 'account_number', desc: '10-digit NUBAN number' },
                  { col: 'amount', desc: 'Amount in Naira' },
                ].map(({ col, desc }) => (
                  <div key={col} className="bg-white rounded-md px-3 py-2 border border-gray-200">
                    <p className="text-xs font-bold text-gray-900">{col}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end">
              <button onClick={handleUpload} disabled={!file}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-forge-primary rounded-lg hover:bg-forge-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Upload &amp; Process
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Normalizing ── */}
        {step === 'normalizing' && (
          <motion.div key="normalizing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <svg className="w-16 h-16 animate-spin text-forge-primary/20" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" />
                </svg>
                <svg className="w-16 h-16 absolute inset-0 animate-spin text-forge-primary" viewBox="0 0 100 100" style={{ animationDuration: '1.5s' }}>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="80 200" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-900">Processing your file</p>
              <p className="text-sm text-gray-500 mt-1">{normStage}</p>
            </div>
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">Progress</span>
                <span className="text-xs font-bold text-forge-primary">{normProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <motion.div className="h-full bg-forge-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${normProgress}%` }} transition={{ duration: 0.3 }} />
              </div>
              <div className="mt-4 flex justify-center gap-6 text-xs text-gray-400">
                <span className={normProgress >= 10 ? 'text-green-500' : ''}>Parse</span>
                <span className={normProgress >= 30 ? 'text-green-500' : ''}>Normalize</span>
                <span className={normProgress >= 55 ? 'text-green-500' : ''}>Validate</span>
                <span className={normProgress >= 90 ? 'text-green-500' : ''}>Finalize</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Review ── */}
        {step === 'review' && uploadResult && (
          <motion.div key="review" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Validation Results</h2>
              <p className="text-sm text-gray-500 mb-4">Review the parsed and normalized records before proceeding to payment.</p>

              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium">Total Records</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{uploadResult.totalRecords}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs text-green-600 font-medium">Valid</p>
                  <p className="text-xl font-bold text-green-700 mt-1">{validCount}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-xs text-red-600 font-medium">Failed</p>
                  <p className="text-xl font-bold text-red-700 mt-1">{failedTransactions.all.length}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-blue-600 font-medium">Total Amount</p>
                  <p className="text-lg font-bold text-blue-700 mt-1">{formatCurrency(uploadResult.totalAmount)}</p>
                </div>
              </div>

              {/* No errors */}
              {failedTransactions.all.length === 0 && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-green-700 font-medium">All records passed validation. Ready to proceed.</p>
                </div>
              )}

              {/* ── Duplicate warnings ── */}
              {failedTransactions.duplicates.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-amber-700 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      Potential Duplicates ({failedTransactions.duplicates.length})
                    </h3>
                    <button onClick={() => setShowDuplicateConfirm(true)}
                      className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors">
                      Confirm All - Not Duplicates
                    </button>
                  </div>
                  <div className="bg-amber-50 rounded-lg border border-amber-200 overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-amber-100/50 border-b border-amber-200">
                          <th className="text-left px-4 py-2 text-xs font-semibold text-amber-700">Name</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-amber-700">Bank</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-amber-700">Account</th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-amber-700">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100">
                        {failedTransactions.duplicates.map((t) => (
                          <tr key={t.id}>
                            <td className="px-4 py-2 text-amber-900">{t.recipientName}</td>
                            <td className="px-4 py-2 text-amber-800">{t.rawBankName}</td>
                            <td className="px-4 py-2 font-mono text-xs text-amber-800">{t.accountNumber}</td>
                            <td className="px-4 py-2 text-right text-amber-900 font-medium">{formatCurrency(t.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-amber-600 mt-2">
                    These transactions match existing records. If they are intentional, click &quot;Confirm All&quot; to process them.
                  </p>
                </div>
              )}

              {/* ── NUBAN / Account errors ── */}
              {failedTransactions.nuban.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Account/NUBAN Errors ({failedTransactions.nuban.length})
                  </h3>
                  <div className="bg-red-50 rounded-lg border border-red-200 overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-red-100/50 border-b border-red-200">
                          <th className="text-left px-4 py-2 text-xs font-semibold text-red-700">Name</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-red-700">Bank</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-red-700">Account</th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-red-700">Amount</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-red-700">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-100">
                        {failedTransactions.nuban.map((t) => (
                          <tr key={t.id}>
                            <td className="px-4 py-2 text-red-900">{t.recipientName}</td>
                            <td className="px-4 py-2 text-red-800">{t.rawBankName}</td>
                            <td className="px-4 py-2 font-mono text-xs text-red-800">{t.accountNumber}</td>
                            <td className="px-4 py-2 text-right text-red-900 font-medium">{formatCurrency(t.amount)}</td>
                            <td className="px-4 py-2 text-xs text-red-600">{t.failureReason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-red-500 mt-2">
                    Please verify the account numbers and bank names. Re-upload the corrected CSV to fix these.
                  </p>
                </div>
              )}

              {/* ── Other errors ── */}
              {failedTransactions.other.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-red-700 mb-2">
                    Other Errors ({failedTransactions.other.length})
                  </h3>
                  <div className="bg-red-50 rounded-lg border border-red-200 overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-red-100/50 border-b border-red-200">
                          <th className="text-left px-4 py-2 text-xs font-semibold text-red-700">Name</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-red-700">Bank</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-red-700">Account</th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-red-700">Amount</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-red-700">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-100">
                        {failedTransactions.other.map((t) => (
                          <tr key={t.id}>
                            <td className="px-4 py-2 text-red-900">{t.recipientName}</td>
                            <td className="px-4 py-2 text-red-800">{t.rawBankName}</td>
                            <td className="px-4 py-2 font-mono text-xs text-red-800">{t.accountNumber}</td>
                            <td className="px-4 py-2 text-right text-red-900 font-medium">{formatCurrency(t.amount)}</td>
                            <td className="px-4 py-2 text-xs text-red-600">{t.failureReason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Download failed */}
              {failedTransactions.all.length > 0 && (
                <div className="mb-6 flex items-center justify-between bg-gray-50 rounded-lg border border-gray-200 p-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{failedTransactions.all.length}</span> failed record(s) with original data and failure reasons
                  </p>
                  <button onClick={handleDownloadFailed}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Failed Records CSV
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button onClick={handleProceedToPayment} disabled={validCount === 0}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-forge-primary rounded-lg hover:bg-forge-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Proceed to Payment ({validCount} records)
                </button>
                <button onClick={() => router.push(`/dashboard/payout-batches/${uploadResult.batchId}`)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  View Batch Details
                </button>
                <button onClick={handleReset}
                  className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                  Start Over
                </button>
              </div>
            </div>

            {/* Duplicate confirmation modal */}
            <ConfirmModal
              open={showDuplicateConfirm}
              title="Confirm These Are Not Duplicates?"
              message={`This will re-queue ${failedTransactions.duplicates.length} transaction(s) flagged as potential duplicates. They will be processed as new transactions.`}
              confirmLabel={confirmingDuplicates ? 'Confirming...' : 'Yes, Process Them'}
              variant="warning"
              onConfirm={handleConfirmDuplicates}
              onCancel={() => setShowDuplicateConfirm(false)}
            />
          </motion.div>
        )}

        {/* ── Step 4: Processing / Payment ── */}
        {step === 'processing' && (
          <motion.div key="processing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              {!batchDone ? (
                <>
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 border-4 border-forge-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-900">Processing Payments</p>
                    <p className="text-sm text-gray-500 mt-1">{processed} of {total} transactions processed</p>
                  </div>
                  <div className="max-w-md mx-auto mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">Progress</span>
                      <span className="text-xs font-bold text-forge-primary">
                        {total > 0 ? Math.round((processed / total) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div className="h-full bg-forge-primary rounded-full"
                        animate={{ width: total > 0 ? `${(processed / total) * 100}%` : '0%' }}
                        transition={{ duration: 0.5 }} />
                    </div>
                  </div>
                  {summary && (
                    <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">{summary.successCount}</p>
                        <p className="text-xs text-gray-500">Successful</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-red-600">{summary.failedCount}</p>
                        <p className="text-xs text-gray-500">Failed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-amber-600">{summary.pendingCount}</p>
                        <p className="text-xs text-gray-500">Pending</p>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-center">
                    <button onClick={handlePayInBackground}
                      className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      Continue in Background
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      processingDetail?.status === 'completed' ? 'bg-green-100' : 'bg-amber-100'
                    }`}>
                      {processingDetail?.status === 'completed' ? (
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      )}
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {processingDetail?.status === 'completed' ? 'All Payments Completed' : 'Batch Processing Finished'}
                    </p>
                    {processingDetail?.status !== 'completed' && (
                      <p className="text-sm text-amber-600 mt-1">Some transactions failed</p>
                    )}
                  </div>
                  {summary && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-500 font-medium">Total</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">{summary.totalRecords}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-green-600 font-medium">Successful</p>
                        <p className="text-xl font-bold text-green-700 mt-1">{summary.successCount}</p>
                        <p className="text-xs text-green-500 mt-0.5">{formatCurrency(summary.successAmount)}</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-red-600 font-medium">Failed</p>
                        <p className="text-xl font-bold text-red-700 mt-1">{summary.failedCount}</p>
                        <p className="text-xs text-red-500 mt-0.5">{formatCurrency(summary.failedAmount)}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <p className="text-xs text-blue-600 font-medium">Success Rate</p>
                        <p className="text-xl font-bold text-blue-700 mt-1">{(summary.successRate).toFixed(1)}%</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <button onClick={() => router.push(`/dashboard/payout-batches/${uploadResult?.batchId}`)}
                      className="px-5 py-2.5 text-sm font-semibold text-white bg-forge-primary rounded-lg hover:bg-forge-primary/90 transition-colors">
                      View Batch Details
                    </button>
                    <button onClick={handleReset}
                      className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      Upload Another
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
