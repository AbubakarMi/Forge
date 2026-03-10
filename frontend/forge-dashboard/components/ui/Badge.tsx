interface BadgeProps {
  status: 'success' | 'pending' | 'failed'
}

const badgeConfig: Record<string, { label: string; classes: string; dot: string }> = {
  success: {
    label: 'Active',
    classes: 'bg-green-500/10 text-green-400 border-green-500/20',
    dot: 'bg-green-500',
  },
  pending: {
    label: 'Pending',
    classes: 'bg-forge-accent/10 text-forge-accent border-forge-accent/20',
    dot: 'bg-forge-accent',
  },
  failed: {
    label: 'Failed',
    classes: 'bg-red-500/10 text-red-400 border-red-500/20',
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
