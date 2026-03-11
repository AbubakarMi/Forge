'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/useToast'
import ToastContainer from '@/components/ui/Toast'

export default function ToastProvider() {
  const { toasts, removeToast } = useToast()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return <ToastContainer toasts={toasts} onRemove={removeToast} />
}
