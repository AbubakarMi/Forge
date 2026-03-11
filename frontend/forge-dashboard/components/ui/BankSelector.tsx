'use client'

import { useState, useEffect, useRef } from 'react'
import { bankService } from '@/services/bankService'

interface BankOption {
  id: string
  name: string
  code: string
}

interface BankSelectorProps {
  value?: string
  onChange: (bankId: string, bankName: string, bankCode: string) => void
  placeholder?: string
  className?: string
}

export default function BankSelector({ value, onChange, placeholder = 'Search banks...', className = '' }: BankSelectorProps) {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<BankOption[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setOptions([])
      return
    }
    const timeout = setTimeout(async () => {
      try {
        const results = await bankService.searchBanks(query)
        setOptions(results.map(b => ({ id: b.id, name: b.name, code: b.code })))
      } catch {
        setOptions([])
      }
    }, 200)
    return () => clearTimeout(timeout)
  }, [query])

  const handleSelect = (bank: BankOption) => {
    setSelectedLabel(`${bank.name} (${bank.code})`)
    setQuery('')
    setIsOpen(false)
    onChange(bank.id, bank.name, bank.code)
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        type="text"
        value={isOpen ? query : selectedLabel}
        onChange={e => { setQuery(e.target.value); setIsOpen(true) }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forge-primary focus:border-transparent text-sm"
      />
      {isOpen && options.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map(bank => (
            <li
              key={bank.id}
              onClick={() => handleSelect(bank)}
              className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
            >
              <span className="text-sm text-gray-900">{bank.name}</span>
              <code className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{bank.code}</code>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
