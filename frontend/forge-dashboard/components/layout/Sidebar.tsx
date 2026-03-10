'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'API Keys',
    href: '/dashboard/api-keys',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
  },
  {
    label: 'Transactions',
    href: '/dashboard/transactions',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    label: 'Payouts',
    href: '/dashboard/payouts',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    Cookies.remove('forge_token')
    router.push('/login')
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-64 min-h-screen bg-forge-surface text-forge-text flex flex-col flex-shrink-0 border-r border-forge-border">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-forge-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-forge-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-forge-primary/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <span className="font-black text-lg tracking-tight text-forge-text">Forge</span>
            <span className="block text-[10px] text-forge-muted font-bold tracking-widest uppercase -mt-0.5">Admin</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        <p className="px-3 text-[10px] font-bold text-forge-muted uppercase tracking-widest mb-4">
          Core Infrastructure
        </p>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${isActive(item.href)
                ? 'bg-forge-primary text-white shadow-lg shadow-forge-primary/20 translate-x-1'
                : 'text-forge-muted hover:text-forge-primary hover:bg-white hover:translate-x-1'
              }`}
          >
            <span className={`transition-colors duration-200 ${isActive(item.href) ? 'text-white' : 'text-forge-muted group-hover:text-forge-primary'}`}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 py-6 border-t border-forge-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-forge-muted hover:text-red-600 hover:bg-red-50 transition-all duration-200"
        >
          <svg className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  )
}

