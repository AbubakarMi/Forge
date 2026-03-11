'use client'

import { useToast } from '@/hooks/useToast'
import ToastContainer from '@/components/ui/Toast'

export default function ToastProvider() {
  const { toasts, removeToast } = useToast()
  return <ToastContainer toasts={toasts} onRemove={removeToast} />
}
