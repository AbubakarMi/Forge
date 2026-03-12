'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { webhookService, WebhookEndpoint } from '@/services/webhookService'
import { showToast } from '@/hooks/useToast'
import EmptyState from '@/components/ui/EmptyState'
import Pagination from '@/components/ui/Pagination'
import ConfirmModal from '@/components/ui/ConfirmModal'

const PAGE_SIZE = 10

const AVAILABLE_EVENTS = [
  'batch.completed',
  'batch.failed',
  'transaction.completed',
  'transaction.failed',
]

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export default function WebhooksPage() {
  const router = useRouter()
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [urlError, setUrlError] = useState('')

  // Secret display state
  const [createdWebhook, setCreatedWebhook] = useState<WebhookEndpoint | null>(null)
  const [copied, setCopied] = useState(false)

  // Pagination
  const [page, setPage] = useState(1)

  // Action states
  const [testingId, setTestingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const fetchWebhooks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await webhookService.getWebhooks()
      setWebhooks(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load webhooks.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWebhooks()
  }, [fetchWebhooks])

  const totalPages = Math.ceil(webhooks.length / PAGE_SIZE)
  const paginatedWebhooks = useMemo(
    () => webhooks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [webhooks, page]
  )

  const handleToggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    )
  }

  const handleCreate = async () => {
    setUrlError('')
    if (!newUrl.trim()) {
      setUrlError('URL is required.')
      return
    }
    if (!isValidUrl(newUrl.trim())) {
      setUrlError('Please enter a valid URL (http:// or https://).')
      return
    }
    if (selectedEvents.length === 0) {
      setUrlError('Select at least one event.')
      return
    }

    setCreating(true)
    try {
      const webhook = await webhookService.registerWebhook({
        url: newUrl.trim(),
        events: selectedEvents,
      })
      setCreatedWebhook(webhook)
    } catch {
      showToast('error', 'Failed to create webhook.')
    } finally {
      setCreating(false)
    }
  }

  const handleCloseAddModal = () => {
    setShowAddModal(false)
    setNewUrl('')
    setSelectedEvents([])
    setUrlError('')
    if (createdWebhook) {
      setCreatedWebhook(null)
      setCopied(false)
      fetchWebhooks()
    }
  }

  const handleCopySecret = async (secret: string) => {
    await navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTest = async (id: string) => {
    setTestingId(id)
    try {
      await webhookService.testWebhook(id)
      showToast('success', 'Test event sent successfully.')
    } catch {
      showToast('error', 'Failed to send test event.')
    } finally {
      setTestingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null)
    setDeletingId(id)
    try {
      await webhookService.removeWebhook(id)
      showToast('success', 'Webhook deleted.')
      await fetchWebhooks()
    } catch {
      showToast('error', 'Failed to delete webhook.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webhooks</h1>
          <p className="text-gray-500 mt-1">Manage webhook endpoints for real-time event notifications.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Webhook
        </button>
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

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-4 bg-gray-100 rounded w-48 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-32 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-16 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-24 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-20 animate-pulse" />
              </div>
            ))}
          </div>
        ) : webhooks.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            }
            title="No webhooks configured"
            description="Add a webhook endpoint to receive real-time event notifications."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-gray-500 font-medium px-6 py-3 uppercase tracking-wider text-xs">URL</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 uppercase tracking-wider text-xs">Events</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 uppercase tracking-wider text-xs">Status</th>
                  <th className="text-left text-gray-500 font-medium px-6 py-3 uppercase tracking-wider text-xs">Created</th>
                  <th className="text-right text-gray-500 font-medium px-6 py-3 uppercase tracking-wider text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedWebhooks.map((wh) => (
                  <tr
                    key={wh.id}
                    onClick={() => router.push(`/dashboard/webhooks/${wh.id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-gray-800 max-w-[280px] truncate block" title={wh.url}>
                        {wh.url.length > 50 ? wh.url.slice(0, 50) + '...' : wh.url}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {wh.events.map((ev) => (
                          <span
                            key={ev}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {ev}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {wh.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(wh.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleTest(wh.id)}
                          disabled={testingId === wh.id}
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {testingId === wh.id ? 'Sending...' : 'Test'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(wh.id)}
                          disabled={deletingId === wh.id}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {deletingId === wh.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalCount={webhooks.length}
          onPageChange={setPage}
        />
      </div>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!confirmDeleteId}
        title="Delete Webhook"
        message="This will permanently delete this webhook endpoint. You will stop receiving event notifications at this URL. This action cannot be undone."
        confirmLabel="Delete Webhook"
        variant="danger"
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Add Webhook Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleCloseAddModal}
          />
          <div className="relative bg-white border border-gray-200 rounded-2xl shadow-xl w-full max-w-md p-6">
            {createdWebhook ? (
              <>
                {/* Secret display */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Webhook Created</h2>
                  <button
                    onClick={handleCloseAddModal}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-amber-800 font-medium">
                    Save this secret — it won&apos;t be shown again. Use it to verify webhook signatures.
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Signing Secret</p>
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-sm font-mono text-gray-900 break-all flex-1">
                      {createdWebhook.secret}
                    </code>
                    <button
                      onClick={() => handleCopySecret(createdWebhook.secret)}
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

                <button
                  onClick={handleCloseAddModal}
                  className="w-full px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                {/* Add form */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Add Webhook</h2>
                  <button
                    onClick={handleCloseAddModal}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* URL input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Endpoint URL
                    </label>
                    <input
                      type="text"
                      value={newUrl}
                      onChange={(e) => {
                        setNewUrl(e.target.value)
                        setUrlError('')
                      }}
                      placeholder="https://example.com/webhooks"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                    />
                    {urlError && (
                      <p className="mt-1 text-xs text-red-600">{urlError}</p>
                    )}
                  </div>

                  {/* Event checkboxes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Events
                    </label>
                    <div className="space-y-2">
                      {AVAILABLE_EVENTS.map((event) => (
                        <label
                          key={event}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedEvents.includes(event)}
                            onChange={() => handleToggleEvent(event)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 font-mono">{event}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="flex-1 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {creating ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      'Create Webhook'
                    )}
                  </button>
                  <button
                    onClick={handleCloseAddModal}
                    className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
