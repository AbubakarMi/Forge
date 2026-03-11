'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiKeyService } from '@/services/apiKeyService'
import { ApiKey, ApiKeyCreated } from '@/types'
import EmptyState from '@/components/ui/EmptyState'

type Permission = 'read' | 'write' | 'admin'

function getPermissionBadge(permission: string) {
  const p = permission?.toLowerCase() || 'read'
  switch (p) {
    case 'admin':
      return 'bg-red-100 text-red-800'
    case 'write':
      return 'bg-amber-100 text-amber-800'
    case 'read':
    default:
      return 'bg-blue-100 text-blue-800'
  }
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [selectedPermission, setSelectedPermission] = useState<Permission>('read')
  const [createdKey, setCreatedKey] = useState<ApiKeyCreated | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchKeys = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  const handleCreateKey = async () => {
    setCreating(true)
    setError('')
    setCreatedKey(null)
    try {
      const data = await apiKeyService.createKey(selectedPermission)
      setCreatedKey(data)
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
    try {
      await apiKeyService.revokeKey(id)
      await fetchKeys()
    } catch {
      setError('Failed to revoke API key.')
    } finally {
      setRevokingId(null)
    }
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCloseModal = () => {
    setCreatedKey(null)
    setCopied(false)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-500 mt-1">Manage your API credentials and access tokens.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPermission}
            onChange={(e) => setSelectedPermission(e.target.value as Permission)}
            className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="read">Read</option>
            <option value="write">Write</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={handleCreateKey}
            disabled={creating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Key
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Keys Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          /* Loading Skeleton */
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-4 bg-gray-100 rounded w-40 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-16 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-20 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-24 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-16 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-20 animate-pulse" />
              </div>
            ))}
          </div>
        ) : keys.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            }
            title="No API keys yet"
            description="Create your first API key to start making requests."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-gray-500 font-medium px-6 py-3 uppercase tracking-wider text-xs">Key Prefix</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 uppercase tracking-wider text-xs">Permission</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 uppercase tracking-wider text-xs">Last Used</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 uppercase tracking-wider text-xs">Created</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 uppercase tracking-wider text-xs">Status</th>
                  <th className="text-right text-gray-500 font-medium px-6 py-3 uppercase tracking-wider text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {keys.map((apiKey) => (
                  <tr key={apiKey.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <code className="font-mono text-xs bg-gray-100 text-gray-800 px-2.5 py-1 rounded border border-gray-200">
                        {apiKey.keyPrefix}********
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${getPermissionBadge(apiKey.permissions)}`}>
                        {apiKey.permissions || 'read'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {relativeTime(apiKey.lastUsedAt)}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(apiKey.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {apiKey.isRevoked ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                          Revoked
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!apiKey.isRevoked ? (
                        <button
                          onClick={() => handleRevoke(apiKey.id)}
                          disabled={revokingId === apiKey.id}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {revokingId === apiKey.id ? 'Revoking...' : 'Revoke'}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Revoked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* One-time Key Display Modal */}
      {createdKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          <div className="relative bg-white border border-gray-200 rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">API Key Created</h2>
              <button
                onClick={handleCloseModal}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-800 font-medium">
                Copy your API key now. It will not be shown again.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between gap-3">
                <code className="text-sm font-mono text-gray-900 break-all flex-1">
                  {createdKey.fullKey}
                </code>
                <button
                  onClick={() => handleCopy(createdKey.fullKey)}
                  className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-500">Permission:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${getPermissionBadge(createdKey.permissions)}`}>
                {createdKey.permissions || 'read'}
              </span>
            </div>

            <button
              onClick={handleCloseModal}
              className="w-full px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
