import { ReactNode } from 'react'

interface CardProps {
  title?: string
  children: ReactNode
  className?: string
}

export default function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-[24px] border border-forge-border shadow-sm hover:shadow-xl hover:shadow-forge-primary/5 transition-all duration-300 ${className}`}>
      {title && (
        <div className="px-6 py-5 border-b border-forge-border">
          <h3 className="text-lg font-bold text-forge-text tracking-tight">{title}</h3>
        </div>
      )}
      <div className="p-6 md:p-8">{children}</div>
    </div>
  )
}
