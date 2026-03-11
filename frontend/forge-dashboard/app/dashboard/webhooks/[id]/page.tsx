'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { webhookService, WebhookEndpoint, WebhookDelivery } from '@/services/webhookService'
import { showToast } from '@/hooks/useToast'
import EmptyState from '@/components/ui/EmptyState'

function statusCodeBadge(code: number | null) {
  if (code === null) {
    return 'bg-gray-100 text-gray-600'
  }
  if (code >= 200 && code < 300) {
    return 'bg-green-100 text-green-800'
  }
  if (code >= 400 && code < 500) {
    return 'bg-yellow-100 text-yellow-800'
  }
  if (code >= 500) {
    return 'bg-red-100 text-red-800'
  }
  return 'bg-gray-100 text-gray-600'
}

function formatDateTime(date: string | null): string {
  if (!date) return '--'
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

function isRetryable(code: number | null): boolean {
  if (code === null) return true
  return code < 200 || code >= 300
}

export default function WebhookDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [webhook, setWebhook] = useState<WebhookEndpoint | null>(null)
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [webhooks, deliveryList] = await Promise.all([
        webhookService.getWebhooks(),
        webhookService.getDeliveries(id),
      ])
      const found = webhooks.find((w) => w.id === id) || null
      setWebhook(found)
      setDeliveries(Array.isArray(deliveryList) ? deliveryList : [])
    } catch {
      showToast('error', 'Failed to load webhook details.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRetry = async (deliveryId: string) => {
    setRetryingId(deliveryId)
    try {
      await webhookService.retryDelivery(deliveryId)
      showToast('success', 'Delivery retry queued.')
      await loadData()
    } catch {
      showToast('error', 'Failed to retry delivery.')
    } finally {
      setRetryingId(null)
    }
  }

  const toggleExpand = (deliveryId: string) => {
    setExpandedId((prev) => (prev === deliveryId ? null : deliveryId))
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-gray-200 rounded w-32" />
          <div className="h-8 bg-gray-200 rounded w-96" />
          <div className="h-4 bg-gray-200 rounded w-48" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!webhook) {
    return (
      <div className="max-w-5xl mx-auto text-center py-16">
        <p className="text-gray-500">Webhook not found.</p>
        <button
          onClick={() => router.push('/dashboard/webhooks')}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Back to Webhooks
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back link */}
      <button
        onClick={() => router.push('/dashboard/webhooks')}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Webhooks
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 break-all">{webhook.url}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {webhook.events.map((ev) => (
            <span
              key={ev}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {ev}
            </span>
          ))}
          {webhook.isActive ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
              Active
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
              Inactive
            </span>
          )}
        </div>
      </div>

      {/* Deliveries */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Delivery History</h2>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {deliveries.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              title="No deliveries yet"
              description="Deliveries will appear here once events are triggered."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left text-gray-500 font-medium px-6 py-3 uppercase tracking-wider text-xs">Event</th>
                    <th className="text-left text-gray-500 font-medium px-6 py-3 uppercase tracking-wider text-xs">Status</th>
                    <th className="text-left text-gray-500 font-medium px-6 py-3 uppercase tracking-wider text-xs">Delivered At</th>
                    <th className="text-left text-gray-500 font-medium px-6 py-3 uppercase tracking-wider text-xs">Attempts</th>
                    <th className="text-right text-gray-500 font-medium px-6 py-3 uppercase tracking-wider text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deliveries.map((d) => (
                    <tr key={d.id} className="group">
                      <td colSpan={5} className="p-0">
                        {/* Main row */}
                        <div
                          onClick={() => toggleExpand(d.id)}
                          className="flex items-center cursor-pointer hover:bg-gray-50 transition-colors px-6 py-4"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="font-mono text-xs text-gray-800">{d.event}</span>
                          </div>
                          <div className="w-24">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCodeBadge(d.statusCode)}`}>
                              {d.statusCode !== null ? d.statusCode : 'Pending'}
                            </span>
                          </div>
                          <div className="w-48 text-gray-500 text-sm">
                            {formatDateTime(d.deliveredAt)}
                          </div>
                          <div className="w-20 text-gray-500 text-sm">
                            {d.attempts}
                          </div>
                          <div className="w-28 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            {isRetryable(d.statusCode) && (
                              <button
                                onClick={() => handleRetry(d.id)}
                                disabled={retryingId === d.id}
                                className="px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {retryingId === d.id ? 'Retrying...' : 'Retry'}
                              </button>
                            )}
                            <svg
                              className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === d.id ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {expandedId === d.id && (
                          <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 space-y-4">
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Payload</p>
                              <pre className="bg-gray-900 text-green-400 text-xs rounded-lg p-4 overflow-x-auto max-h-64">
                                <code>{formatJson(d.payload)}</code>
                              </pre>
                            </div>
                            {d.response !== null && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Response</p>
                                <pre className="bg-gray-900 text-gray-300 text-xs rounded-lg p-4 overflow-x-auto max-h-64">
                                  <code>{d.response}</code>
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
