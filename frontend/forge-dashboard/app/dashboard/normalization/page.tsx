'use client'

import { useState } from 'react'
import apiClient from '@/services/apiClient'

interface NormResult {
  normalizedBank: string | null
  bankCode: string | null
  confidence: number
  originalInput: string
  matchType: string
  bestGuess?: string | null
  bestGuessCode?: string | null
}

interface ApiResponseWrapper<T> {
  success: boolean
  data: T
}

function confidenceColor(c: number): string {
  if (c >= 0.9) return 'text-green-600 bg-green-50'
  if (c >= 0.7) return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

function confidenceLabel(c: number): string {
  if (c >= 0.9) return 'High'
  if (c >= 0.7) return 'Medium'
  return 'Low'
}

export default function NormalizationPage() {
  const [singleInput, setSingleInput] = useState('')
  const [singleResult, setSingleResult] = useState<NormResult | null>(null)
  const [singleLoading, setSingleLoading] = useState(false)

  const [batchInput, setBatchInput] = useState('')
  const [batchResults, setBatchResults] = useState<NormResult[]>([])
  const [batchLoading, setBatchLoading] = useState(false)

  const handleSingleNormalize = async () => {
    if (!singleInput.trim()) return
    setSingleLoading(true)
    setSingleResult(null)
    try {
      const res = await apiClient.post<ApiResponseWrapper<NormResult>>('/api/banks/normalize', {
        bankName: singleInput.trim()
      })
      setSingleResult(res.data.data)
    } catch {
      // toast handled by apiClient
    } finally {
      setSingleLoading(false)
    }
  }

  const handleBatchNormalize = async () => {
    const names = batchInput.split('\n').map(s => s.trim()).filter(Boolean)
    if (names.length === 0) return
    setBatchLoading(true)
    setBatchResults([])
    try {
      const res = await apiClient.post<ApiResponseWrapper<NormResult[]>>('/api/banks/normalize-batch', {
        bankNames: names
      })
      setBatchResults(res.data.data)
    } catch {
      // toast handled by apiClient
    } finally {
      setBatchLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Bank Normalization Test</h1>
      <p className="text-sm text-gray-500 mb-8">Test the AI-powered bank name normalization engine.</p>

      {/* Single Normalization */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Single Bank Name</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={singleInput}
            onChange={e => setSingleInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSingleNormalize()}
            placeholder='e.g. "UBA PLC", "GTB", "First Bnk"'
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forge-primary focus:border-transparent"
          />
          <button
            onClick={handleSingleNormalize}
            disabled={singleLoading || !singleInput.trim()}
            className="px-5 py-2.5 text-sm font-medium text-white bg-forge-primary rounded-lg hover:bg-forge-primary/90 disabled:opacity-50"
          >
            {singleLoading ? 'Matching...' : 'Normalize'}
          </button>
        </div>

        {singleResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Input:</span>
              <span className="text-sm font-medium text-gray-900">{singleResult.originalInput}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Result:</span>
              <span className="text-sm font-bold text-gray-900">
                {singleResult.normalizedBank ?? (singleResult.bestGuess ? `${singleResult.bestGuess} (rejected)` : 'No match')}
              </span>
              {singleResult.bankCode && (
                <code className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-mono">{singleResult.bankCode}</code>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Confidence:</span>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${confidenceColor(singleResult.confidence)}`}>
                {(singleResult.confidence * 100).toFixed(1)}% — {confidenceLabel(singleResult.confidence)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Match type:</span>
              <span className="text-xs text-gray-600">{singleResult.matchType}</span>
            </div>
          </div>
        )}
      </div>

      {/* Batch Normalization */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Batch Test (one per line)</h2>
        <textarea
          value={batchInput}
          onChange={e => setBatchInput(e.target.value)}
          rows={6}
          placeholder={'UBA PLC\nGTB\nFirst Bnk\nZenith Bank Nigeria\naccess bnk plc'}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forge-primary focus:border-transparent font-mono text-sm"
        />
        <button
          onClick={handleBatchNormalize}
          disabled={batchLoading || !batchInput.trim()}
          className="mt-3 px-5 py-2.5 text-sm font-medium text-white bg-forge-primary rounded-lg hover:bg-forge-primary/90 disabled:opacity-50"
        >
          {batchLoading ? 'Processing...' : 'Normalize All'}
        </button>

        {batchResults.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Input</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Normalized</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Code</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Confidence</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {batchResults.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-sm text-gray-900">{r.originalInput}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900">
                      {r.normalizedBank ?? <span className="text-red-500">No match</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      {r.bankCode && (
                        <code className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">{r.bankCode}</code>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${confidenceColor(r.confidence)}`}>
                        {(r.confidence * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{r.matchType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
