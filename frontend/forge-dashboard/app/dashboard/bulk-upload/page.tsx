'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { payoutBatchService, CreateBatchResponse, BatchSummary } from '@/services/payoutBatchService'
import { walletService, WalletBalance } from '@/services/walletService'
import { PayoutBatchDetail, TransactionDetail } from '@/types'
import StatusBadge from '@/components/ui/StatusBadge'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { showToast } from '@/hooks/useToast'

type Step = 'upload' | 'normalizing' | 'review' | 'create' | 'processing'

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

  // Create batch step
  const [batchName, setBatchName] = useState('')
  const [batchNameError, setBatchNameError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [paymentType, setPaymentType] = useState<'immediate' | 'scheduled' | 'recurring'>('immediate')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [recurringInterval, setRecurringInterval] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly')

  // Processing step
  const [processingDetail, setProcessingDetail] = useState<PayoutBatchDetail | null>(null)
  const [summary, setSummary] = useState<BatchSummary | null>(null)
  const [processingInBackground, setProcessingInBackground] = useState(false)

  // Review tab
  const [reviewTab, setReviewTab] = useState<'all' | 'valid' | 'failed'>('all')
  // Inline edit
  const [editingTxId, setEditingTxId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ recipientName: '', bankName: '', accountNumber: '', amount: '' })
  const [editSaving, setEditSaving] = useState(false)
  // Re-upload failed
  const [reuploadFile, setReuploadFile] = useState<File | null>(null)
  const [reuploading, setReuploading] = useState(false)
  // Duplicate confirmation
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false)
  const [confirmingDuplicates, setConfirmingDuplicates] = useState(false)
  // Wallet balance
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null)

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
      const detail = await payoutBatchService.getBatchDetail(uploadResult.batchId)
      setBatchDetail(detail)
    } catch {
      showToast('error', 'Failed to confirm duplicates.')
    } finally {
      setConfirmingDuplicates(false)
    }
  }

  const handleStartEdit = (t: TransactionDetail) => {
    setEditingTxId(t.id)
    setEditForm({
      recipientName: t.recipientName,
      bankName: t.rawBankName,
      accountNumber: t.accountNumber,
      amount: String(t.amount),
    })
  }

  const handleSaveEdit = async () => {
    if (!uploadResult || !editingTxId) return
    setEditSaving(true)
    try {
      const result = await payoutBatchService.updateTransaction(uploadResult.batchId, editingTxId, {
        recipientName: editForm.recipientName,
        bankName: editForm.bankName,
        accountNumber: editForm.accountNumber,
        amount: parseFloat(editForm.amount) || 0,
      })
      // Refresh batch detail to get updated data
      const detail = await payoutBatchService.getBatchDetail(uploadResult.batchId)
      setBatchDetail(detail)
      // Update upload result counts
      const pendingCount = detail.transactions.filter(t => t.status === 'pending').length
      const failedCount = detail.transactions.filter(t => t.status === 'failed').length
      setUploadResult(prev => prev ? {
        ...prev,
        validRecords: pendingCount,
        invalidRecords: failedCount,
        totalAmount: detail.totalAmount,
        totalRecords: detail.totalRecords,
      } : prev)
      if (result.status === 'pending') {
        showToast('success', 'Record fixed and passed validation.')
      } else {
        showToast('error', result.failureReason || 'Record still has errors.')
      }
      setEditingTxId(null)
    } catch {
      showToast('error', 'Failed to update record.')
    } finally {
      setEditSaving(false)
    }
  }

  const handleReuploadFailed = async () => {
    if (!uploadResult || !reuploadFile) return
    setReuploading(true)
    try {
      const result = await payoutBatchService.reuploadFailed(uploadResult.batchId, reuploadFile)
      const detail = await payoutBatchService.getBatchDetail(uploadResult.batchId)
      setBatchDetail(detail)
      const pendingCount = detail.transactions.filter(t => t.status === 'pending').length
      const failedCount = detail.transactions.filter(t => t.status === 'failed').length
      setUploadResult(prev => prev ? {
        ...prev,
        validRecords: pendingCount,
        invalidRecords: failedCount,
        totalAmount: detail.totalAmount,
        totalRecords: detail.totalRecords,
      } : prev)
      showToast('success', `Replaced failed records: ${result.newValidCount} now valid, ${result.stillFailedCount} still need fixing.`)
      setReuploadFile(null)
    } catch {
      showToast('error', 'Failed to re-upload.')
    } finally {
      setReuploading(false)
    }
  }

  const handleProceedToCreate = () => {
    setStep('create')
    setBatchName('')
    setBatchNameError('')
    walletService.getBalance().then(setWalletBalance).catch(() => null)
  }

  const handleConfirmBatch = async () => {
    if (!uploadResult) return
    const name = batchName.trim()
    if (!name) {
      setBatchNameError('Batch name is required.')
      return
    }
    if (name.length < 3) {
      setBatchNameError('Batch name must be at least 3 characters.')
      return
    }
    if (paymentType !== 'immediate' && !scheduledDate) {
      setBatchNameError('Please select a date for scheduled/recurring payments.')
      return
    }
    setBatchNameError('')
    setConfirming(true)
    try {
      const params: {
        batchName: string
        paymentType: string
        scheduledAt?: string
        recurringInterval?: string
      } = { batchName: name, paymentType }

      if (paymentType !== 'immediate' && scheduledDate) {
        const dt = scheduledTime ? `${scheduledDate}T${scheduledTime}:00` : `${scheduledDate}T09:00:00`
        params.scheduledAt = new Date(dt).toISOString()
      }
      if (paymentType === 'recurring') {
        params.recurringInterval = recurringInterval
      }

      await payoutBatchService.confirmBatch(uploadResult.batchId, params)

      if (paymentType === 'immediate') {
        showToast('success', 'Batch confirmed and queued for processing.')
        setStep('processing')
        setProcessingDetail(null)
        setSummary(null)
        setProcessingInBackground(false)
      } else {
        showToast('success', `Batch scheduled${paymentType === 'recurring' ? ` (recurring ${recurringInterval})` : ''}.`)
        router.push('/dashboard/payout-batches')
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setBatchNameError(msg || 'Failed to confirm batch. Please try a different name.')
    } finally {
      setConfirming(false)
    }
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
    setBatchName('')
    setBatchNameError('')
    setPaymentType('immediate')
    setScheduledDate('')
    setScheduledTime('')
    setRecurringInterval('monthly')
  }

  const stepLabels: { key: Step; label: string }[] = [
    { key: 'upload', label: 'Upload' },
    { key: 'normalizing', label: 'Validate' },
    { key: 'review', label: 'Review' },
    { key: 'create', label: 'Create Batch' },
    { key: 'processing', label: 'Payment' },
  ]
  const stepIndex = stepLabels.findIndex(s => s.key === step)

  const batchDone = processingDetail && ['completed', 'partially_failed', 'failed'].includes(processingDetail.status)
  const processed = processingDetail ? (processingDetail.successCount + processingDetail.failedCount) : 0
  const total = processingDetail?.totalRecords ?? uploadResult?.totalRecords ?? 0
  const validCount = batchDetail?.transactions.filter(t => t.status === 'pending').length ?? uploadResult?.validRecords ?? 0
  const validAmount = batchDetail?.transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0) ?? 0

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
            {i < stepLabels.length - 1 && <div className="w-6 h-0.5 bg-gray-200" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Upload */}
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
                Upload &amp; Validate
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Normalizing */}
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

        {/* Step 3: Review */}
        {step === 'review' && uploadResult && batchDetail && (
          <motion.div key="review" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Review All Records</h2>
              <p className="text-sm text-gray-500 mb-4">Review every record. You can edit failed ones inline or re-upload a corrected CSV.</p>

              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium">Total Records</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{batchDetail.transactions.length}</p>
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
                  <p className="text-xs text-blue-600 font-medium">Payment Amount</p>
                  <p className="text-lg font-bold text-blue-700 mt-1">{formatCurrency(validAmount)}</p>
                  <p className="text-[10px] text-blue-500 mt-0.5">{validCount} records will be paid</p>
                </div>
              </div>

              {/* All passed banner */}
              {failedTransactions.all.length === 0 && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-green-700 font-medium">All {validCount} records passed validation. Ready to proceed.</p>
                </div>
              )}

              {/* Failed actions bar */}
              {failedTransactions.all.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700 font-medium flex-1">
                    {failedTransactions.all.length} record(s) failed validation. Fix them below or re-upload a corrected CSV.
                  </p>
                  <div className="flex items-center gap-2">
                    {failedTransactions.duplicates.length > 0 && (
                      <button onClick={() => setShowDuplicateConfirm(true)}
                        className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors">
                        Confirm Duplicates ({failedTransactions.duplicates.length})
                      </button>
                    )}
                    <button onClick={handleDownloadFailed}
                      className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                      Download Failed CSV
                    </button>
                    <label className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer">
                      Re-upload Fixed CSV
                      <input type="file" accept=".csv" className="hidden" onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) { setReuploadFile(f); e.target.value = '' }
                      }} />
                    </label>
                  </div>
                </div>
              )}

              {/* Re-upload confirmation */}
              {reuploadFile && (
                <div className="mb-4 flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-indigo-700">
                      <span className="font-medium">{reuploadFile.name}</span> selected. This will replace all {failedTransactions.all.length} failed records.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setReuploadFile(null)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleReuploadFailed} disabled={reuploading}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                      {reuploading ? 'Uploading...' : 'Replace Failed Records'}
                    </button>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex items-center gap-1 mb-3 border-b border-gray-200">
                {([
                  { key: 'all' as const, label: 'All Records', count: batchDetail.transactions.length },
                  { key: 'valid' as const, label: 'Valid', count: validCount },
                  { key: 'failed' as const, label: 'Failed', count: failedTransactions.all.length },
                ]).map((t) => (
                  <button key={t.key} onClick={() => setReviewTab(t.key)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                      reviewTab === t.key
                        ? 'border-forge-primary text-forge-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}>
                    {t.label} ({t.count})
                  </button>
                ))}
              </div>

              {/* Records table */}
              <div className="rounded-lg border border-gray-200 overflow-hidden max-h-[400px] overflow-y-auto mb-6">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Status</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Name</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Bank</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Account</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">Amount</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Issue</th>
                      <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(reviewTab === 'all' ? batchDetail.transactions
                      : reviewTab === 'valid' ? batchDetail.transactions.filter(t => t.status === 'pending')
                      : failedTransactions.all
                    ).map((t) => (
                      editingTxId === t.id ? (
                        /* Inline edit row */
                        <tr key={t.id} className="bg-blue-50/50">
                          <td className="px-4 py-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                          </td>
                          <td className="px-4 py-1.5">
                            <input type="text" value={editForm.recipientName}
                              onChange={(e) => setEditForm(f => ({ ...f, recipientName: e.target.value }))}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-forge-primary focus:border-transparent" />
                          </td>
                          <td className="px-4 py-1.5">
                            <input type="text" value={editForm.bankName}
                              onChange={(e) => setEditForm(f => ({ ...f, bankName: e.target.value }))}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-forge-primary focus:border-transparent" />
                          </td>
                          <td className="px-4 py-1.5">
                            <input type="text" value={editForm.accountNumber}
                              onChange={(e) => setEditForm(f => ({ ...f, accountNumber: e.target.value }))}
                              className="w-full px-2 py-1.5 text-sm font-mono border border-gray-300 rounded focus:ring-1 focus:ring-forge-primary focus:border-transparent" />
                          </td>
                          <td className="px-4 py-1.5">
                            <input type="number" value={editForm.amount}
                              onChange={(e) => setEditForm(f => ({ ...f, amount: e.target.value }))}
                              className="w-full px-2 py-1.5 text-sm text-right border border-gray-300 rounded focus:ring-1 focus:ring-forge-primary focus:border-transparent" />
                          </td>
                          <td className="px-4 py-1.5" colSpan={1}>
                            <span className="text-xs text-blue-600">Editing...</span>
                          </td>
                          <td className="px-4 py-1.5">
                            <div className="flex items-center gap-1">
                              <button onClick={handleSaveEdit} disabled={editSaving}
                                className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
                                title="Save & revalidate">
                                {editSaving ? (
                                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                              <button onClick={() => setEditingTxId(null)}
                                className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors" title="Cancel">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        /* Normal display row */
                        <tr key={t.id} className={t.status === 'failed' ? 'bg-red-50/30' : ''}>
                          <td className="px-4 py-2.5">
                            <span className={`w-2.5 h-2.5 rounded-full inline-block ${
                              t.status === 'pending' ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                          </td>
                          <td className="px-4 py-2.5 text-gray-900">{t.recipientName}</td>
                          <td className="px-4 py-2.5 text-gray-700">
                            {t.normalizedBankName || t.rawBankName}
                            {t.normalizedBankName && t.rawBankName !== t.normalizedBankName && (
                              <span className="block text-[10px] text-gray-400">{t.rawBankName}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{t.accountNumber}</td>
                          <td className="px-4 py-2.5 text-right text-gray-900 font-medium">{formatCurrency(t.amount)}</td>
                          <td className="px-4 py-2.5 text-xs text-red-600 max-w-[200px] truncate" title={t.failureReason || ''}>
                            {t.failureReason || <span className="text-green-600">Passed</span>}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {t.status === 'failed' && (
                              <button onClick={() => handleStartEdit(t)}
                                className="p-1 text-indigo-500 hover:bg-indigo-50 rounded transition-colors" title="Edit this record">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    ))}
                    {batchDetail.transactions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No records.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button onClick={handleProceedToCreate} disabled={validCount === 0}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-forge-primary rounded-lg hover:bg-forge-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Continue with {validCount} valid record{validCount !== 1 ? 's' : ''} ({formatCurrency(validAmount)})
                </button>
                <button onClick={handleReset}
                  className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                  Start Over
                </button>
              </div>
            </div>

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

        {/* Step 4: Create Batch (name + scheduling) */}
        {step === 'create' && uploadResult && (
          <motion.div key="create" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-lg mx-auto">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Create Batch</h2>
                <p className="text-sm text-gray-500 mt-1">Name your batch and choose when to process payments.</p>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500">Records</p>
                    <p className="text-lg font-bold text-gray-900">{validCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(validAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">File</p>
                    <p className="text-sm font-medium text-gray-700 truncate">{uploadResult.fileName}</p>
                  </div>
                </div>
              </div>

              {/* Wallet Balance Check */}
              {walletBalance && (
                <div className={`rounded-lg p-4 mb-6 border ${
                  walletBalance.balance >= validAmount
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className={`w-4 h-4 ${walletBalance.balance >= validAmount ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-600">Wallet Balance</span>
                    </div>
                    <span className={`text-sm font-bold ${walletBalance.balance >= validAmount ? 'text-green-700' : 'text-red-700'}`}>
                      {formatCurrency(walletBalance.balance)}
                    </span>
                  </div>
                  {walletBalance.balance < validAmount && (
                    <div className="mt-2">
                      <p className="text-xs text-red-600 font-medium">
                        Insufficient balance. You need {formatCurrency(validAmount - walletBalance.balance)} more to process this batch.
                      </p>
                      <button
                        onClick={() => router.push('/dashboard/wallet')}
                        className="mt-2 text-xs font-semibold text-red-700 underline hover:text-red-800"
                      >
                        Fund Wallet
                      </button>
                    </div>
                  )}
                  {walletBalance.balance >= validAmount && (
                    <p className="text-xs text-green-600 mt-1">
                      Remaining after payout: {formatCurrency(walletBalance.balance - validAmount)}
                    </p>
                  )}
                </div>
              )}

              {/* Batch name input */}
              <div className="mb-5">
                <label htmlFor="batchName" className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Name
                </label>
                <input
                  id="batchName"
                  type="text"
                  value={batchName}
                  onChange={(e) => { setBatchName(e.target.value); setBatchNameError('') }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && paymentType === 'immediate') handleConfirmBatch() }}
                  placeholder="e.g. March Salary, Vendor Payments Q1"
                  className={`w-full px-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-forge-primary focus:border-transparent transition-colors ${
                    batchNameError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  autoFocus
                />
                {batchNameError && (
                  <p className="text-xs text-red-600 mt-1.5">{batchNameError}</p>
                )}
                <p className="text-xs text-gray-400 mt-1.5">Must be unique. You cannot create two batches with the same name.</p>
              </div>

              {/* Payment type selector */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { key: 'immediate' as const, label: 'Pay Now', icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )},
                    { key: 'scheduled' as const, label: 'Schedule', icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )},
                    { key: 'recurring' as const, label: 'Recurring', icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )},
                  ]).map(({ key, label, icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPaymentType(key)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        paymentType === key
                          ? 'border-forge-primary bg-forge-primary/5 text-forge-primary'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scheduling options */}
              {paymentType !== 'immediate' && (
                <div className="mb-5 space-y-4 bg-blue-50/50 rounded-lg border border-blue-100 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forge-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forge-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                  {paymentType === 'recurring' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Repeat Every</label>
                      <select
                        value={recurringInterval}
                        onChange={(e) => setRecurringInterval(e.target.value as 'weekly' | 'biweekly' | 'monthly')}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forge-primary focus:border-transparent"
                      >
                        <option value="weekly">Every Week</option>
                        <option value="biweekly">Every 2 Weeks</option>
                        <option value="monthly">Every Month</option>
                      </select>
                      <p className="text-xs text-blue-600 mt-1.5">
                        Payments will automatically repeat on this schedule. You can add recipients later.
                      </p>
                    </div>
                  )}
                  {paymentType === 'scheduled' && (
                    <p className="text-xs text-blue-600">
                      Payment will be processed automatically at the selected date and time.
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleConfirmBatch}
                  disabled={confirming || !batchName.trim() || (paymentType !== 'immediate' && !scheduledDate) || (paymentType === 'immediate' && walletBalance !== null && walletBalance.balance < validAmount)}
                  className="flex-1 px-5 py-3 text-sm font-semibold text-white bg-forge-primary rounded-lg hover:bg-forge-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {confirming ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Confirming...
                    </span>
                  ) : paymentType === 'immediate' ? (
                    'Confirm & Start Payment'
                  ) : paymentType === 'scheduled' ? (
                    'Schedule Payment'
                  ) : (
                    'Set Up Recurring Payment'
                  )}
                </button>
                <button onClick={() => setStep('review')}
                  className="px-5 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                  Back
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 5: Processing / Payment */}
        {step === 'processing' && (
          <motion.div key="processing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              {!batchDone ? (
                <>
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 border-4 border-forge-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-900">Processing Payments</p>
                    <p className="text-sm text-gray-500 mt-1">{processed} of {total} transactions processed</p>
                    {batchName && <p className="text-xs text-gray-400 mt-1">Batch: {batchName}</p>}
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
                    {batchName && <p className="text-sm text-gray-500 mt-0.5">{batchName}</p>}
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
