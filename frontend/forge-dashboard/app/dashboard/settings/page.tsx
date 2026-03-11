'use client'

import { useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { showToast } from '@/hooks/useToast'

interface NotificationPrefs {
  batchCompleted: boolean
  batchFailed: boolean
  failedTransactions: boolean
  weeklySummary: boolean
}

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean
  onChange: (val: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-forge-primary' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function SettingsPage() {
  const [email, setEmail] = useState('Loading...')
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    batchCompleted: true,
    batchFailed: true,
    failedTransactions: false,
    weeklySummary: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const token = Cookies.get('forge_token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setEmail(payload.email || payload.sub || 'Unknown')
      } catch {
        setEmail('Unknown')
      }
    } else {
      setEmail('Unknown')
    }
  }, [])

  const updatePref = (key: keyof NotificationPrefs, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    // Simulate save -- backend endpoint not yet built
    await new Promise((resolve) => setTimeout(resolve, 500))
    setSaving(false)
    showToast('success', 'Settings saved')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your profile and notification preferences.</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
          <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
            {email}
          </div>
          <p className="text-xs text-gray-400 mt-1">Email cannot be changed at this time.</p>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Email on batch completed</p>
              <p className="text-xs text-gray-500 mt-0.5">Receive an email when a payout batch finishes processing.</p>
            </div>
            <Toggle enabled={prefs.batchCompleted} onChange={(v) => updatePref('batchCompleted', v)} />
          </div>

          <div className="border-t border-gray-100" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Email on batch failed</p>
              <p className="text-xs text-gray-500 mt-0.5">Receive an email when a batch encounters a critical failure.</p>
            </div>
            <Toggle enabled={prefs.batchFailed} onChange={(v) => updatePref('batchFailed', v)} />
          </div>

          <div className="border-t border-gray-100" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Email on failed transactions</p>
              <p className="text-xs text-gray-500 mt-0.5">Get notified when individual transactions within a batch fail.</p>
            </div>
            <Toggle enabled={prefs.failedTransactions} onChange={(v) => updatePref('failedTransactions', v)} />
          </div>

          <div className="border-t border-gray-100" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Weekly summary email</p>
              <p className="text-xs text-gray-500 mt-0.5">Receive a weekly digest of your payout activity and stats.</p>
            </div>
            <Toggle enabled={prefs.weeklySummary} onChange={(v) => updatePref('weeklySummary', v)} />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 text-sm font-medium text-white bg-forge-primary rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
