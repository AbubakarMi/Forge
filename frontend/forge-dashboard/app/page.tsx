import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-forge-background text-forge-text">
      {/* Navigation */}
      <nav className="border-b border-forge-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-forge-primary rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">Forge API</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-forge-muted hover:text-white transition-colors duration-200 font-medium"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="bg-forge-primary text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-all duration-200"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-forge-surface border border-forge-border rounded-full px-4 py-1.5 mb-8">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-forge-muted font-medium">Now in Beta — API v1.0</span>
          </div>

          {/* Heading */}
          <h1 className="text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            <span className="text-white">Financial APIs for</span>
            <br />
            <span className="bg-gradient-to-r from-forge-primary to-forge-secondary bg-clip-text text-transparent">
              Modern Products
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-xl text-forge-muted mb-12 max-w-2xl mx-auto leading-relaxed">
            APIs powering modern financial products. Manage transactions, issue payouts,
            and control API access — all from one developer-first dashboard.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/dashboard"
              className="bg-forge-primary text-white px-8 py-3.5 rounded-xl font-semibold text-lg hover:opacity-90 transition-all duration-200 hover:shadow-lg hover:shadow-forge-primary/25 inline-flex items-center gap-2"
            >
              Get Started
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="bg-forge-surface text-white border border-forge-border px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-white/5 transition-all duration-200 inline-flex items-center gap-2"
            >
              Login
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              ),
              title: 'API Key Management',
              description: 'Create, rotate, and revoke API keys with granular access control and real-time monitoring.',
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              ),
              title: 'Transaction Tracking',
              description: 'Full visibility into every transaction with detailed logs, status tracking, and audit trails.',
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              title: 'Instant Payouts',
              description: 'Trigger and manage payouts programmatically with real-time status updates and bank integration.',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-forge-surface border border-forge-border rounded-2xl p-6 hover:bg-white/5 transition-all duration-200"
            >
              <div className="w-12 h-12 bg-forge-primary/10 rounded-xl flex items-center justify-center text-forge-primary mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-forge-muted text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-forge-border px-6 py-8 mt-16">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-forge-muted">
          <span>© 2026 Forge API. All rights reserved.</span>
          <span>Built for developers, by developers.</span>
        </div>
      </footer>
    </div>
  )
}

