'use client'

import { useState, useEffect, useCallback } from 'react'
import { bankService } from '@/services/bankService'
import { showToast } from '@/hooks/useToast'

interface BankItem {
  id: string
  name: string
  code: string
  country: string
  isActive: boolean
  aliasCount: number
}

interface BankDetail {
  id: string
  name: string
  code: string
  country: string
  isActive: boolean
  createdAt: string
  aliases: { id: string; alias: string; createdAt: string }[]
}

export default function BanksPage() {
  const [banks, setBanks] = useState<BankItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedDetail, setExpandedDetail] = useState<BankDetail | null>(null)
  const [showAddBank, setShowAddBank] = useState(false)
  const [bankForm, setBankForm] = useState({ name: '', code: '', country: 'Nigeria' })
  const [aliasInput, setAliasInput] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    loadBanks()
  }, [])

  const loadBanks = async () => {
    try {
      const data = await bankService.getBanks()
      setBanks(data)
    } catch {
      showToast('error', 'Failed to load banks.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = useCallback(async (query: string) => {
    setSearch(query)
    if (!query.trim()) {
      loadBanks()
      return
    }
    try {
      const data = await bankService.searchBanks(query)
      setBanks(data)
    } catch {
      // silent
    }
  }, [])

  const handleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      setExpandedDetail(null)
      return
    }
    try {
      const detail = await bankService.getBank(id)
      setExpandedId(id)
      setExpandedDetail(detail)
    } catch {
      showToast('error', 'Failed to load bank details.')
    }
  }

  const handleAddBank = async () => {
    if (!bankForm.name || !bankForm.code) return
    setAdding(true)
    try {
      await bankService.createBank(bankForm)
      showToast('success', 'Bank created.')
      setShowAddBank(false)
      setBankForm({ name: '', code: '', country: 'Nigeria' })
      await loadBanks()
    } catch {
      // toast handled by apiClient
    } finally {
      setAdding(false)
    }
  }

  const handleAddAlias = async () => {
    if (!expandedId || !aliasInput.trim()) return
    try {
      await bankService.addAlias(expandedId, aliasInput.trim())
      showToast('success', 'Alias added.')
      setAliasInput('')
      const detail = await bankService.getBank(expandedId)
      setExpandedDetail(detail)
      await loadBanks()
    } catch {
      // toast handled by apiClient
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Registry</h1>
          <p className="text-sm text-gray-500 mt-1">{banks.length} banks</p>
        </div>
        <button
          onClick={() => setShowAddBank(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-forge-primary rounded-lg hover:bg-forge-primary/90 transition-colors"
        >
          Add Bank
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search by name, code, or alias..."
          className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forge-primary focus:border-transparent text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bank Name</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Country</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aliases</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {banks.map((bank) => (
              <>
                <tr
                  key={bank.id}
                  onClick={() => handleExpand(bank.id)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{bank.name}</td>
                  <td className="px-6 py-4">
                    <code className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">{bank.code}</code>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{bank.country}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{bank.aliasCount}</td>
                </tr>
                {expandedId === bank.id && expandedDetail && (
                  <tr key={`${bank.id}-detail`}>
                    <td colSpan={4} className="px-6 py-4 bg-gray-50">
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Aliases</p>
                        {expandedDetail.aliases.length === 0 ? (
                          <p className="text-sm text-gray-400">No aliases yet.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {expandedDetail.aliases.map(a => (
                              <span key={a.id} className="inline-flex px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700">
                                {a.alias}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <input
                            type="text"
                            value={aliasInput}
                            onChange={e => setAliasInput(e.target.value)}
                            placeholder="Add alias..."
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-forge-primary focus:border-transparent"
                            onClick={e => e.stopPropagation()}
                          />
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAddAlias() }}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-forge-primary rounded-lg hover:bg-forge-primary/90"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Bank Modal */}
      {showAddBank && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Bank</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankForm.name}
                  onChange={e => setBankForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forge-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Code</label>
                <input
                  type="text"
                  value={bankForm.code}
                  onChange={e => setBankForm(f => ({ ...f, code: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forge-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  value={bankForm.country}
                  onChange={e => setBankForm(f => ({ ...f, country: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forge-primary focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddBank}
                disabled={adding || !bankForm.name || !bankForm.code}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-forge-primary rounded-lg hover:bg-forge-primary/90 disabled:opacity-50"
              >
                {adding ? 'Creating...' : 'Create Bank'}
              </button>
              <button
                onClick={() => { setShowAddBank(false); setBankForm({ name: '', code: '', country: 'Nigeria' }) }}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
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
