'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { payoutBatchService, CreateBatchResponse } from '@/services/payoutBatchService'
import { showToast } from '@/hooks/useToast'

type Step = 'upload' | 'processing' | 'results'

export default function BulkUploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [result, setResult] = useState<CreateBatchResponse | null>(null)

  const MAX_SIZE = 10 * 1024 * 1024 // 10MB

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
    setStep('processing')

    try {
      const data = await payoutBatchService.uploadBatch(file)
      setResult(data)
      setStep('results')
    } catch {
      setStep('upload')
      showToast('error', 'Upload failed. Please try again.')
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount)

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bulk Upload</h1>
        <p className="text-sm text-gray-500 mt-1">Upload a CSV file to create a payout batch</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-3 mb-8">
        {(['upload', 'processing', 'results'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s
                  ? 'bg-forge-primary text-white'
                  : i < ['upload', 'processing', 'results'].indexOf(step)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {i + 1}
            </div>
            {i < 2 && <div className="w-12 h-0.5 bg-gray-200" />}
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

            <div className="mt-4 flex items-center justify-between">
              <a
                href="/sample-payout.csv"
                download
                className="text-xs text-forge-primary hover:underline font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                Download sample CSV
              </a>

              <button
                onClick={handleUpload}
                disabled={!file}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-forge-primary rounded-lg hover:bg-forge-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Upload &amp; Validate
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Processing */}
        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center py-16"
          >
            <div className="w-12 h-12 border-4 border-forge-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-700">Uploading and validating...</p>
            <p className="text-xs text-gray-400 mt-1">This may take a moment</p>
          </motion.div>
        )}

        {/* Step 3: Results */}
        {step === 'results' && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Results</h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium">Total Records</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{result.totalRecords}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs text-green-600 font-medium">Valid</p>
                  <p className="text-xl font-bold text-green-700 mt-1">{result.validRecords}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-xs text-red-600 font-medium">Invalid</p>
                  <p className="text-xl font-bold text-red-700 mt-1">{result.invalidRecords}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-blue-600 font-medium">Total Amount</p>
                  <p className="text-xl font-bold text-blue-700 mt-1">{formatCurrency(result.totalAmount)}</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-red-700 mb-2">
                    Validation Errors ({result.errors.length})
                  </h3>
                  <div className="bg-red-50 rounded-lg border border-red-200 overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-red-100/50 border-b border-red-200">
                          <th className="text-left px-4 py-2 text-xs font-semibold text-red-700">Row</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-red-700">Field</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-red-700">Message</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-100">
                        {result.errors.map((err, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 text-red-800 font-mono">{err.rowNumber}</td>
                            <td className="px-4 py-2 text-red-800">{err.field}</td>
                            <td className="px-4 py-2 text-red-700">{err.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/dashboard/payout-batches/${result.batchId}`)}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-forge-primary rounded-lg hover:bg-forge-primary/90 transition-colors"
                >
                  View Batch
                </button>
                <button
                  onClick={() => {
                    setStep('upload')
                    setFile(null)
                    setResult(null)
                  }}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Upload Another
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
