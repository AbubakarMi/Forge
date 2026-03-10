'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { authService } from '@/services/authService'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    try {
      const data = await authService.login(email, password)
      Cookies.set('forge_token', data.token, { expires: 7, sameSite: 'Lax' })
      router.push('/dashboard')
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Invalid email or password. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-forge-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-forge-primary rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Forge API</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-forge-muted mt-2">Sign in to your dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-forge-surface border border-forge-border rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Error Alert */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-forge-muted mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-forge-border rounded-lg text-white placeholder-forge-muted focus:outline-none focus:ring-2 focus:ring-forge-primary focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-forge-muted mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-forge-border rounded-lg text-white placeholder-forge-muted focus:outline-none focus:ring-2 focus:ring-forge-primary focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-forge-primary text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        {/* Register Link */}
        <p className="text-center text-forge-muted mt-6 text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-forge-primary hover:text-white font-medium transition-colors duration-200">
            Create one for free
          </Link>
        </p>
      </div>
    </div>
  )
}

