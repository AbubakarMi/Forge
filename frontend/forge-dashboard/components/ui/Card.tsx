import { ReactNode } from 'react'

interface CardProps {
  title?: string
  children: ReactNode
  className?: string
}

export default function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`bg-forge-surface rounded-xl border border-forge-border shadow-xl shadow-black/20 ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-forge-border">
          <h3 className="text-base font-semibold text-white">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}
