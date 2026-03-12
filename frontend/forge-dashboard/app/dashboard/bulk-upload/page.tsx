'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { payoutBatchService, CreateBatchResponse, BatchSummary } from '@/services/payoutBatchService'
import { PayoutBatchDetail } from '@/types'
import { showToast } from '@/hooks/useToast'

type Step = 'upload' | 'normalizing' | 'review' | 'processing'

export default function BulkUploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadResult, setUploadResult] = useState<CreateBatchResponse | null>(null)

  // Normalizing step progress simulation
  const [normProgress, setNormProgress] = useState(0)
  const [normStage, setNormStage] = useState('')

  // Processing step
  const [batchDetail, setBatchDetail] = useState<PayoutBatchDetail | null>(null)
  const [summary, setSummary] = useState<BatchSummary | null>(null)
  const [processingInBackground, setProcessingInBackground] = useState(false)

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

    // Simulate progress while the backend processes everything
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

      // Brief pause at 100% then move to review
      setTimeout(() => setStep('review'), 600)
    } catch {
      clearInterval(progressInterval)
      setStep('upload')
      showToast('error', 'Upload failed. Please try again.')
    }
  }

  // Poll batch detail during processing step
  useEffect(() => {
    if (step !== 'processing' || !uploadResult?.batchId || processingInBackground) return

    let cancelled = false
    const poll = async () => {
      try {
        const [detail, sum] = await Promise.all([
          payoutBatchService.getBatchDetail(uploadResult.batchId),
          payoutBatchService.getBatchSummary(uploadResult.batchId),
        ])
        if (cancelled) return
        setBatchDetail(detail)
        setSummary(sum)

        // Stop polling when done
        if (detail.status === 'completed' || detail.status === 'partially_failed' || detail.status === 'failed') {
          return
        }
      } catch {
        // ignore polling errors
      }

      if (!cancelled) {
        setTimeout(poll, 2000)
      }
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
    if (!uploadResult || uploadResult.errors.length === 0) return

    const rows = [
      'row,field,failure_reason',
      ...uploadResult.errors.map(
        (err) => `${err.rowNumber},"${err.field}","${err.message.replace(/"/g, '""')}"`
      ),
    ].join('\n')

    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `failed-records-${uploadResult.batchId.slice(0, 8)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleProceedToPayment = () => {
    setStep('processing')
    setBatchDetail(null)
    setSummary(null)
    setProcessingInBackground(false)
  }

  const handlePayInBackground = () => {
    setProcessingInBackground(true)
    showToast('success', 'Batch is processing in the background. You can check its status in Payout Batches.')
    router.push('/dashboard/payout-batches')
  }

  const handleReset = () => {
    setStep('upload')
    setFile(null)
    setUploadResult(null)
    setBatchDetail(null)
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

  const batchDone = batchDetail?.status === 'completed' || batchDetail?.status === 'partially_failed' || batchDetail?.status === 'failed'
  const processed = batchDetail ? (batchDetail.successCount + batchDetail.failedCount) : 0
  const total = batchDetail?.totalRecords ?? uploadResult?.totalRecords ?? 0

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bulk Upload</h1>
        <p className="text-sm text-gray-500 mt-1">Upload a CSV file to create and process a payout batch</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {stepLabels.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i === stepIndex
                    ? 'bg-forge-primary text-white'
                    : i < stepIndex
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i < stepIndex ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-xs font-medium hidden sm:inline ${
                i === stepIndex ? 'text-gray-900' : i < stepIndex ? 'text-green-600' : 'text-gray-400'
              }`}>
                {s.label}
              </span>
            </div>
            {i < stepLabels.length - 1 && <div className="w-8 h-0.5 bg-gray-200" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Upload */}
        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-forge-primary bg-forge-primary/5'
                  : file
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400 bg-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />

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
                  <p className="text-sm font-semibold text-gray-700">
                    Drag and drop your CSV file here
                  </p>
                  <p className="text-xs text-gray-400 mt-1">or click to browse</p>
                  <p className="text-xs text-gray-400 mt-3">CSV only, max 10MB</p>
                </div>
              )}
            </div>

            {/* CSV Format Guide */}
            <div className="mt-4 bg-gray-50 rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Required CSV Columns</p>
                <button
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-forge-primary bg-white border border-forge-primary/30 rounded-lg hover:bg-forge-primary hover:text-white transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download CSV Template
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-white rounded-md px-3 py-2 border border-gray-200">
                  <p className="text-xs font-bold text-gray-900">name</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Recipient full name</p>
                </div>
                <div className="bg-white rounded-md px-3 py-2 border border-gray-200">
                  <p className="text-xs font-bold text-gray-900">bank</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Bank name (e.g. GTB, UBA)</p>
                </div>
                <div className="bg-white rounded-md px-3 py-2 border border-gray-200">
                  <p className="text-xs font-bold text-gray-900">account_number</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">10-digit NUBAN number</p>
                </div>
                <div className="bg-white rounded-md px-3 py-2 border border-gray-200">
                  <p className="text-xs font-bold text-gray-900">amount</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Amount in Naira</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end">
              <button
                onClick={handleUpload}
                disabled={!file}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-forge-primary rounded-lg hover:bg-forge-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Upload &amp; Process
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Normalizing */}
        {step === 'normalizing' && (
          <motion.div
            key="normalizing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-8"
          >
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

            {/* Progress bar */}
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">Progress</span>
                <span className="text-xs font-bold text-forge-primary">{normProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="h-full bg-forge-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${normProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
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
        {step === 'review' && uploadResult && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
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
                  <p className="text-xl font-bold text-green-700 mt-1">{uploadResult.validRecords}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-xs text-red-600 font-medium">Invalid</p>
                  <p className="text-xl font-bold text-red-700 mt-1">{uploadResult.invalidRecords}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-blue-600 font-medium">Total Amount</p>
                  <p className="text-lg font-bold text-blue-700 mt-1">{formatCurrency(uploadResult.totalAmount)}</p>
                </div>
              </div>

              {/* Errors table */}
              {uploadResult.errors.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-red-700">
                      Validation Errors ({uploadResult.errors.length})
                    </h3>
                    <button
                      onClick={handleDownloadFailed}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Failed Records
                    </button>
                  </div>
                  <div className="bg-red-50 rounded-lg border border-red-200 overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-red-100/50 border-b border-red-200">
                          <th className="text-left px-4 py-2 text-xs font-semibold text-red-700">Row</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-red-700">Field</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-red-700">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-100">
                        {uploadResult.errors.slice(0, 50).map((err, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 text-red-800 font-mono">{err.rowNumber}</td>
                            <td className="px-4 py-2 text-red-800">{err.field}</td>
                            <td className="px-4 py-2 text-red-700">{err.message}</td>
                          </tr>
                        ))}
                        {uploadResult.errors.length > 50 && (
                          <tr>
                            <td colSpan={3} className="px-4 py-2 text-xs text-red-500 text-center">
                              ...and {uploadResult.errors.length - 50} more. Download CSV for full list.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Success message when no errors */}
              {uploadResult.errors.length === 0 && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-green-700 font-medium">All records passed validation. Ready to proceed.</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleProceedToPayment}
                  disabled={uploadResult.validRecords === 0}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-forge-primary rounded-lg hover:bg-forge-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Proceed to Payment ({uploadResult.validRecords} records)
                </button>
                <button
                  onClick={() => router.push(`/dashboard/payout-batches/${uploadResult.batchId}`)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  View Batch Details
                </button>
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Start Over
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Processing / Payment */}
        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              {!batchDone ? (
                <>
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 border-4 border-forge-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-900">Processing Payments</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {processed} of {total} transactions processed
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="max-w-md mx-auto mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">Progress</span>
                      <span className="text-xs font-bold text-forge-primary">
                        {total > 0 ? Math.round((processed / total) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div
                        className="h-full bg-forge-primary rounded-full"
                        animate={{ width: total > 0 ? `${(processed / total) * 100}%` : '0%' }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  {/* Live stats */}
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
                    <button
                      onClick={handlePayInBackground}
                      className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Continue in Background
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Completed */}
                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      batchDetail?.status === 'completed' ? 'bg-green-100' : 'bg-amber-100'
                    }`}>
                      {batchDetail?.status === 'completed' ? (
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
                      {batchDetail?.status === 'completed' ? 'All Payments Completed' : 'Batch Processing Finished'}
                    </p>
                    {batchDetail?.status !== 'completed' && (
                      <p className="text-sm text-amber-600 mt-1">Some transactions failed</p>
                    )}
                  </div>

                  {/* Final stats */}
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
                        <p className="text-xl font-bold text-blue-700 mt-1">{(summary.successRate * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => router.push(`/dashboard/payout-batches/${uploadResult?.batchId}`)}
                      className="px-5 py-2.5 text-sm font-semibold text-white bg-forge-primary rounded-lg hover:bg-forge-primary/90 transition-colors"
                    >
                      View Batch Details
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
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
