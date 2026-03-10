'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/authService'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await authService.register(email, password)
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Registration failed. Please try again.'
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
          <h1 className="text-3xl font-bold text-white">Create an account</h1>
          <p className="text-forge-muted mt-2">Start building with Forge API today</p>
        </div>

        {/* Card */}
        <div className="bg-forge-surface border border-forge-border rounded-2xl p-8">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Account Created!</h2>
              <p className="text-forge-muted text-sm">Redirecting you to login...</p>
            </div>
          ) : (
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
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-forge-border rounded-lg text-white placeholder-forge-muted focus:outline-none focus:ring-2 focus:ring-forge-primary focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-forge-muted mb-1.5">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-forge-border rounded-lg text-white placeholder-forge-muted focus:outline-none focus:ring-2 focus:ring-forge-primary focus:border-transparent transition-all duration-200"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-400 text-xs mt-1.5">Passwords do not match</p>
                )}
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
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Login Link */}
        <p className="text-center text-forge-muted mt-6 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-forge-primary hover:text-white font-medium transition-colors duration-200">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

