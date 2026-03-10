interface BadgeProps {
  status: 'success' | 'pending' | 'failed'
}

const badgeConfig: Record<string, { label: string; classes: string; dot: string }> = {
  success: {
    label: 'Active',
    classes: 'bg-green-50 text-green-700 border-green-200',
    dot: 'bg-green-500',
  },
  pending: {
    label: 'Pending',
    classes: 'bg-indigo-50 text-forge-primary border-indigo-200',
    dot: 'bg-forge-primary',
  },
  failed: {
    label: 'Failed',
    classes: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
}

export default function Badge({ status }: BadgeProps) {
  const config = badgeConfig[status] || badgeConfig.pending

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
      {config.label}
    </span>
  )
}
