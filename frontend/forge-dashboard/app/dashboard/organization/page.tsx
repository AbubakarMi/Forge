'use client'

import { useState, useEffect } from 'react'
import { organizationService } from '@/services/organizationService'
import { showToast } from '@/hooks/useToast'

interface OrgDetail {
  id: string
  name: string
  email: string
  country: string
  memberCount: number
  createdAt: string
  updatedAt: string
}

export default function OrganizationPage() {
  const [orgs, setOrgs] = useState<{ id: string; name: string; role: string }[]>([])
  const [selectedOrg, setSelectedOrg] = useState<OrgDetail | null>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', country: '' })

  useEffect(() => {
    loadOrgs()
  }, [])

  const loadOrgs = async () => {
    try {
      const data = await organizationService.getOrganizations()
      setOrgs(data.map(o => ({ id: o.id, name: o.name, role: o.role })))
      if (data.length > 0) {
        await loadOrgDetail(data[0].id)
      }
    } catch {
      showToast('error', 'Failed to load organizations.')
    } finally {
      setLoading(false)
    }
  }

  const loadOrgDetail = async (id: string) => {
    const detail = await organizationService.getOrganization(id)
    setSelectedOrg(detail)
    setForm({ name: detail.name, email: detail.email, country: detail.country })
  }

  const handleSave = async () => {
    if (!selectedOrg) return
    setSaving(true)
    try {
      const updated = await organizationService.updateOrganization(selectedOrg.id, form)
      setSelectedOrg(updated)
      setEditing(false)
      showToast('success', 'Organization updated.')
    } catch {
      showToast('error', 'Failed to update organization.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-40 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (!selectedOrg) {
    return (
      <div className="p-8">
        <p className="text-gray-500">No organization found.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Organization Settings</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{selectedOrg.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{selectedOrg.memberCount} member{selectedOrg.memberCount !== 1 ? 's' : ''}</p>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 text-sm font-medium text-forge-primary border border-forge-primary rounded-lg hover:bg-forge-primary hover:text-white transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
            {editing ? (
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forge-primary focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{selectedOrg.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            {editing ? (
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forge-primary focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{selectedOrg.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            {editing ? (
              <input
                type="text"
                value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forge-primary focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{selectedOrg.country}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
            <p className="text-gray-900">
              {new Date(selectedOrg.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          </div>

          {editing && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 text-sm font-medium text-white bg-forge-primary rounded-lg hover:bg-forge-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setEditing(false)
                  setForm({ name: selectedOrg.name, email: selectedOrg.email, country: selectedOrg.country })
                }}
                className="px-5 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
