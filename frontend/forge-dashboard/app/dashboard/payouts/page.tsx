'use client'

import { useEffect, useState, FormEvent } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import { payoutService } from '@/services/payoutService'
import { Payout } from '@/types'

interface PayoutFormData {
  transactionId: string
  bankAccount: string
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState<PayoutFormData>({
    transactionId: '',
    bankAccount: '',
  })
  const [formErrors, setFormErrors] = useState<Partial<PayoutFormData>>({})
  const [submitting, setSubmitting] = useState(false)

  const fetchPayouts = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await payoutService.getPayouts()
      setPayouts(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load payouts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayouts()
  }, [])

  const validateForm = (): boolean => {
    const errors: Partial<PayoutFormData> = {}
    if (!formData.transactionId.trim()) {
      errors.transactionId = 'Transaction ID is required.'
    }
    if (!formData.bankAccount.trim()) {
      errors.bankAccount = 'Bank account is required.'
    } else if (formData.bankAccount.trim().length < 5) {
      errors.bankAccount = 'Please enter a valid bank account.'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!validateForm()) return

    setSubmitting(true)
    try {
      await payoutService.createPayout(formData.transactionId.trim(), formData.bankAccount.trim())
      setSuccessMessage('Payout created successfully.')
      setShowModal(false)
      setFormData({ transactionId: '', bankAccount: '' })
      setFormErrors({})
      await fetchPayouts()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create payout. Please try again.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setFormData({ transactionId: '', bankAccount: '' })
    setFormErrors({})
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payouts</h1>
          <p className="text-forge-muted mt-1">Create and track payouts to bank accounts.</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Payout
          </span>
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
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Payouts Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin w-6 h-6 text-forge-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-forge-background rounded-full flex items-center justify-center mx-auto mb-4 border border-forge-border">
              <svg className="w-8 h-8 text-forge-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-white font-medium mb-1">No payouts yet</p>
            <p className="text-forge-muted text-sm">Create your first payout to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-forge-border">
                  <th className="text-left text-forge-muted font-medium pb-4 pr-4 uppercase tracking-wider text-[11px]">Payout ID</th>
                  <th className="text-left text-forge-muted font-medium pb-4 pr-4 uppercase tracking-wider text-[11px]">Transaction ID</th>
                  <th className="text-left text-forge-muted font-medium pb-4 pr-4 uppercase tracking-wider text-[11px]">Bank Account</th>
                  <th className="text-left text-forge-muted font-medium pb-4 pr-4 uppercase tracking-wider text-[11px]">Status</th>
                  <th className="text-left text-forge-muted font-medium pb-4 uppercase tracking-wider text-[11px]">Processed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forge-border/50">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-4 pr-4">
                      <span className="font-mono text-xs bg-forge-background text-white px-3 py-1.5 rounded border border-forge-border group-hover:border-forge-primary/30 transition-colors">
                        {payout.id.length > 16 ? `${payout.id.slice(0, 8)}...` : payout.id}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="font-mono text-xs text-forge-muted group-hover:text-forge-text transition-colors">
                        {payout.transactionId.length > 16
                          ? `${payout.transactionId.slice(0, 8)}...`
                          : payout.transactionId}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-white font-medium">
                      {payout.bankAccount}
                    </td>
                    <td className="py-4 pr-4">
                      <Badge status={payout.status as 'success' | 'pending' | 'failed'} />
                    </td>
                    <td className="py-4 text-forge-muted group-hover:text-forge-text transition-colors font-medium">
                      {payout.processedAt
                        ? new Date(payout.processedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Payout Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
            onClick={handleCloseModal}
          />

          {/* Modal */}
          <div className="relative bg-forge-surface border border-forge-border rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">New Payout</h2>
                <p className="text-forge-muted text-sm mt-1">Initiate a transfer to a bank account.</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 -mr-2 text-forge-muted hover:text-white hover:bg-white/5 rounded-full transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Transaction ID"
                name="transactionId"
                type="text"
                placeholder="Enter the transaction ID"
                value={formData.transactionId}
                onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                error={formErrors.transactionId}
                required
              />
              <Input
                label="Bank Account"
                name="bankAccount"
                type="text"
                placeholder="e.g. GB29NWBK60161331926819"
                value={formData.bankAccount}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                error={formErrors.bankAccount}
                required
              />

              <div className="flex gap-4 pt-4">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    'Create Payout'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
