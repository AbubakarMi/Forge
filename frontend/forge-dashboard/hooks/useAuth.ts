'use client'

import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { authService } from '@/services/authService'

const COOKIE_KEY = 'forge_token'

interface UseAuthReturn {
  isAuthenticated: boolean
  token: string | undefined
  logout: () => void
}

function parseJwtPayload(token: string): Record<string, string> | null {
  try {
    const base64 = token.split('.')[1]
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function useAuth(): UseAuthReturn {
  const router = useRouter()

  const token =
    typeof window !== 'undefined' ? Cookies.get(COOKIE_KEY) : undefined

  const isAuthenticated = Boolean(token)

  const logout = useCallback(async () => {
    try {
      await authService.revoke()
    } catch {
      // Silent — still clear local state
    }
    Cookies.remove(COOKIE_KEY)
    router.push('/login')
  }, [router])

  return {
    isAuthenticated,
    token,
    logout,
  }
}

export function useOrgContext() {
  const token =
    typeof window !== 'undefined' ? Cookies.get(COOKIE_KEY) : undefined

  return useMemo(() => {
    if (!token) return { orgId: null, role: null }
    const payload = parseJwtPayload(token)
    return {
      orgId: payload?.org_id ?? null,
      role: payload?.org_role ?? null,
    }
  }, [token])
}
