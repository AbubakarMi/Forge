'use client'

import { useState, useEffect, useCallback } from 'react'
import { organizationService } from '@/services/organizationService'
import { showToast } from '@/hooks/useToast'
import { OrganizationMember } from '@/types'

const roleBadgeColors: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  member: 'bg-gray-100 text-gray-800',
}

export default function MembersPage() {
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ email: '', role: 'member' })
  const [adding, setAdding] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  useEffect(() => {
    loadOrg()
  }, [])

  const loadOrg = async () => {
    try {
      const orgs = await organizationService.getOrganizations()
      if (orgs.length > 0) {
        setOrgId(orgs[0].id)
        await loadMembers(orgs[0].id)
      }
    } catch {
      showToast('error', 'Failed to load organization.')
    } finally {
      setLoading(false)
    }
  }

  const loadMembers = useCallback(async (id: string) => {
    const data = await organizationService.getMembers(id)
    setMembers(data)
  }, [])

  const handleAddMember = async () => {
    if (!orgId || !addForm.email) return
    setAdding(true)
    try {
      await organizationService.addMember(orgId, addForm)
      showToast('success', 'Member added.')
      setShowAddModal(false)
      setAddForm({ email: '', role: 'member' })
      await loadMembers(orgId)
    } catch {
      // Toast handled by apiClient
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!orgId) return
    try {
      await organizationService.removeMember(orgId, userId)
      showToast('success', 'Member removed.')
      setConfirmRemove(null)
      await loadMembers(orgId)
    } catch {
      // Toast handled by apiClient
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-forge-primary rounded-lg hover:bg-forge-primary/90 transition-colors"
        >
          Add Member
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-900">{member.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadgeColors[member.role] || roleBadgeColors.member}`}>
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(member.joinedAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric'
                  })}
                </td>
                <td className="px-6 py-4 text-right">
                  {member.role !== 'owner' && (
                    <>
                      {confirmRemove === member.userId ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-red-600">Remove?</span>
                          <button
                            onClick={() => handleRemoveMember(member.userId)}
                            className="text-xs px-2 py-1 text-white bg-red-600 rounded hover:bg-red-700"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmRemove(null)}
                            className="text-xs px-2 py-1 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRemove(member.userId)}
                          className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Team Member</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="colleague@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forge-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={addForm.role}
                  onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forge-primary focus:border-transparent"
                >
                  <option value="member">Member (read-only + upload)</option>
                  <option value="admin">Admin (manage members + keys)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddMember}
                disabled={adding || !addForm.email}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-forge-primary rounded-lg hover:bg-forge-primary/90 transition-colors disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add Member'}
              </button>
              <button
                onClick={() => { setShowAddModal(false); setAddForm({ email: '', role: 'member' }) }}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
