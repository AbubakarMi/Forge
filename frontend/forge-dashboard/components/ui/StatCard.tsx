'use client'

import { ReactNode } from 'react'

interface Props {
  title: string
  value: string
  icon: ReactNode
  color: string
  trend?: string
  trendUp?: boolean
}

export default function StatCard({ title, value, icon, color, trend, trendUp }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2 truncate">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              {trend}
            </p>
          )}
        </div>
        <div className={`${color} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
