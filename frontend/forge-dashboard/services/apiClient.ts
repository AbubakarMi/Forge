import axios from 'axios'
import Cookies from 'js-cookie'
import { showToast } from '@/hooks/useToast'
import { v4 as uuidv4 } from 'uuid'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: true, // Send HttpOnly cookies (refresh token)
})

// Request interceptor: attach JWT + idempotency key
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('forge_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Auto-generate idempotency key for state-changing requests
    if (['post', 'put', 'patch'].includes(config.method || '')) {
      config.headers['Idempotency-Key'] = uuidv4()
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Track if we're currently refreshing to prevent multiple refresh calls
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token!)
    }
  })
  failedQueue = []
}

// Response interceptor: handle errors + silent token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status
    const data = error.response?.data
    const message = data?.message || 'An unexpected error occurred.'

    // Silent refresh on 401 (except for auth endpoints)
    if (status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/api/auth/')) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await apiClient.post('/api/auth/refresh')
        const newToken = response.data?.data?.token

        if (newToken) {
          Cookies.set('forge_token', newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          processQueue(null, newToken)
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        processQueue(refreshError, null)
        Cookies.remove('forge_token')
        if (typeof window !== 'undefined') {
          showToast('error', 'Session expired. Please log in again.')
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    switch (status) {
      case 401:
        Cookies.remove('forge_token')
        if (typeof window !== 'undefined') {
          showToast('error', 'Session expired. Please log in again.')
          window.location.href = '/login'
        }
        break
      case 403:
        showToast('error', 'You do not have permission to perform this action.')
        break
      case 404:
        showToast('error', message)
        break
      case 409:
        showToast('warning', message)
        break
      case 422:
        showToast('warning', message)
        break
      case 429:
        showToast('warning', 'Too many requests. Please try again later.')
        break
      case 400:
        // Validation errors — let the form handle it
        break
      default:
        if (status && status >= 500) {
          showToast('error', 'Something went wrong. Please try again later.')
        }
        break
    }

    return Promise.reject(error)
  }
)

export default apiClient
