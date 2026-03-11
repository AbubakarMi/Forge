'use client'

import { usePathname } from 'next/navigation'
import Cookies from 'js-cookie'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/api-keys': 'API Keys',
  '/dashboard/transactions': 'Transactions',
  '/dashboard/payouts': 'Payouts',
  '/dashboard/banks': 'Bank Registry',
  '/dashboard/normalization': 'AI Normalization',
  '/dashboard/organization': 'Organization',
  '/dashboard/organization/members': 'Team Members',
  '/dashboard/bulk-upload': 'Bulk Upload',
  '/dashboard/payout-batches': 'Payout Batches',
}

function getPageTitle(pathname: string): string {
  return pageTitles[pathname] || 'Forge Dashboard'
}

export default function TopBar() {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)

  const token = typeof window !== 'undefined' ? Cookies.get('forge_token') : null
  const userEmail = token
    ? (() => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.email || payload.sub || 'User'
      } catch {
        return 'User'
      }
    })()
    : 'User'

  const initials = userEmail
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-forge-border px-6 py-4 flex items-center justify-between flex-shrink-0 z-10 shadow-sm">
      {/* Left: Page Title + Breadcrumb */}
      <div>
        <h2 className="text-lg font-bold text-forge-text tracking-tight">{pageTitle}</h2>
        <p className="text-[10px] text-forge-muted mt-0.5 uppercase tracking-widest font-bold flex items-center gap-1.5">
          Forge
          {pageTitle !== 'Overview' && (
            <>
              <svg className="w-2.5 h-2.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </svg>
              {pageTitle}
            </>
          )}
        </p>
      </div>

      {/* Right: User Info */}
      <div className="flex items-center gap-5">
        {/* Notification Bell */}
        <button className="text-forge-muted hover:text-forge-primary hover:bg-forge-primary/5 p-2 rounded-xl transition-all relative">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-2 right-2 w-2 h-2 bg-forge-primary rounded-full border-2 border-white" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-forge-border" />

        {/* User Avatar */}
        <div className="flex items-center gap-3 pl-1 group cursor-pointer">
          <div className="w-10 h-10 bg-gradient-to-br from-forge-primary to-forge-secondary rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg shadow-forge-primary/20 ring-2 ring-transparent group-hover:ring-forge-primary/30 transition-all duration-300">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-forge-text leading-none group-hover:text-forge-primary transition-colors">{userEmail}</p>
            <p className="text-[10px] text-forge-muted mt-1 font-bold uppercase tracking-tighter">Developer Tier</p>
          </div>
        </div>
      </div>
    </header>
  )
}
