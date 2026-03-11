'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

const COOKIE_KEY = 'forge_token'

interface UseAuthReturn {
  isAuthenticated: boolean
  token: string | undefined
  logout: () => void
}

export function useAuth(): UseAuthReturn {
  const router = useRouter()

  const token =
    typeof window !== 'undefined' ? Cookies.get(COOKIE_KEY) : undefined

  const isAuthenticated = Boolean(token)

  const logout = useCallback(() => {
    Cookies.remove(COOKIE_KEY)
    router.push('/login')
  }, [router])

  return {
    isAuthenticated,
    token,
    logout,
  }
}
