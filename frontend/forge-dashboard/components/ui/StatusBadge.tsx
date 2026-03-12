'use client'

export default function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()

  let colors: string

  switch (normalized) {
    case 'pending':
      colors = 'bg-yellow-100 text-yellow-800'
      break
    case 'processing':
      colors = 'bg-blue-100 text-blue-800'
      break
    case 'completed':
      colors = 'bg-green-100 text-green-800'
      break
    case 'failed':
      colors = 'bg-red-100 text-red-800'
      break
    case 'cancelled':
      colors = 'bg-gray-100 text-gray-800'
      break
    case 'partial':
    case 'partially_failed':
      colors = 'bg-orange-100 text-orange-800'
      break
    default:
      colors = 'bg-gray-100 text-gray-600'
  }

  const label = normalized === 'partially_failed' ? 'Partial' : normalized

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${colors}`}>
      {label}
    </span>
  )
}
