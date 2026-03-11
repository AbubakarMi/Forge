import axios from 'axios'
import Cookies from 'js-cookie'
import { showToast } from '@/hooks/useToast'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// Request interceptor: attach JWT token from cookies
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('forge_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor: unwrap ApiResponse and handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const data = error.response?.data

    // Parse standardized ApiResponse format
    const message = data?.message || 'An unexpected error occurred.'

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
      case 429:
        showToast('warning', 'Too many requests. Please try again later.')
        break
      case 400:
        // Validation errors — don't auto-toast, let the form handle it
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
