'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { apiKeyService } from '@/services/apiKeyService'
import { ApiKey } from '@/types'

function maskKey(key: string): string {
  if (key.length <= 8) return key
  const last4 = key.slice(-4)
  const prefix = key.startsWith('forge_') ? 'forge_' : key.slice(0, 6)
  return `${prefix}${'*'.repeat(8)}${last4}`
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null)

  const fetchKeys = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiKeyService.getKeys()
      setKeys(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load API keys.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKeys()
  }, [])

  const handleCreateKey = async () => {
    setCreating(true)
    setError('')
    setSuccessMessage('')
    setNewKeyValue(null)
    try {
      const data = await apiKeyService.createKey()
      if (data?.fullKey) {
        setNewKeyValue(data.fullKey)
      }
      setSuccessMessage('New API key created. Copy it now — it will not be shown again.')
      await fetchKeys()
    } catch {
      setError('Failed to create API key.')
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return
    setRevokingId(id)
    setError('')
    setSuccessMessage('')
    try {
      await apiKeyService.revokeKey(id)
      setSuccessMessage('API key revoked successfully.')
      await fetchKeys()
    } catch {
      setError('Failed to revoke API key.')
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">API Keys</h1>
          <p className="text-forge-muted mt-1">Manage your API credentials and access tokens.</p>
        </div>
        <Button
          variant="primary"
          onClick={handleCreateKey}
          disabled={creating}
        >
          {creating ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Key
            </span>
          )}
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm space-y-3 shadow-lg shadow-green-500/5">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </div>
          {newKeyValue && (
            <div className="mt-2 bg-forge-background border border-green-500/20 rounded-lg p-4 group relative">
              <p className="text-[10px] text-forge-muted mb-2 font-semibold uppercase tracking-widest">Your new API key</p>
              <div className="flex items-center justify-between gap-4">
                <code className="text-sm font-mono text-white break-all">{newKeyValue}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newKeyValue)
                  }}
                  className="p-1.5 hover:bg-white/5 rounded text-forge-muted hover:text-white transition-colors"
                  title="Copy to clipboard"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Keys Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin w-6 h-6 text-forge-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-forge-background rounded-full flex items-center justify-center mx-auto mb-4 border border-forge-border">
              <svg className="w-8 h-8 text-forge-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <p className="text-white font-medium mb-1">No API keys yet</p>
            <p className="text-forge-muted text-sm">Create your first API key to start making requests.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-forge-border">
                  <th className="text-left text-forge-muted font-medium pb-3 pr-4 uppercase tracking-wider text-[11px]">Key</th>
                  <th className="text-left text-forge-muted font-medium pb-3 pr-4 uppercase tracking-wider text-[11px]">Created</th>
                  <th className="text-left text-forge-muted font-medium pb-3 pr-4 uppercase tracking-wider text-[11px]">Status</th>
                  <th className="text-right text-forge-muted font-medium pb-3 uppercase tracking-wider text-[11px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forge-border/50">
                {keys.map((apiKey) => (
                  <tr key={apiKey.id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-4 pr-4">
                      <code className="font-mono text-xs bg-forge-background text-white px-3 py-1.5 rounded border border-forge-border group-hover:border-forge-primary/30 transition-colors">
                        {maskKey(apiKey.keyPrefix)}
                      </code>
                    </td>
                    <td className="py-4 pr-4 text-forge-muted group-hover:text-forge-text transition-colors">
                      {new Date(apiKey.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-4 pr-4">
                      <Badge status={apiKey.isRevoked ? 'failed' : 'success'} />
                    </td>
                    <td className="py-4 text-right">
                      {!apiKey.isRevoked && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRevoke(apiKey.id)}
                          disabled={revokingId === apiKey.id}
                        >
                          {revokingId === apiKey.id ? 'Revoking...' : 'Revoke'}
                        </Button>
                      )}
                      {apiKey.isRevoked && (
                        <span className="text-xs text-forge-muted italic">Revoked</span>
                      )}
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
