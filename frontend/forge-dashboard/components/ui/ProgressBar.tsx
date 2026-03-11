'use client'

interface ProgressBarProps {
  success: number
  failed: number
  pending: number
}

export default function ProgressBar({ success, failed, pending }: ProgressBarProps) {
  const total = success + failed + pending

  if (total === 0) {
    return (
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden" />
    )
  }

  const successPct = (success / total) * 100
  const failedPct = (failed / total) * 100
  const pendingPct = (pending / total) * 100

  return (
    <div className="w-full">
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
        {successPct > 0 && (
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${successPct}%` }}
            title={`Success: ${success} (${successPct.toFixed(1)}%)`}
          />
        )}
        {failedPct > 0 && (
          <div
            className="h-full bg-red-500 transition-all duration-500"
            style={{ width: `${failedPct}%` }}
            title={`Failed: ${failed} (${failedPct.toFixed(1)}%)`}
          />
        )}
        {pendingPct > 0 && (
          <div
            className="h-full bg-yellow-400 transition-all duration-500"
            style={{ width: `${pendingPct}%` }}
            title={`Pending: ${pending} (${pendingPct.toFixed(1)}%)`}
          />
        )}
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          Success: {success}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          Failed: {failed}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          Pending: {pending}
        </span>
      </div>
    </div>
  )
}
