import apiClient from './apiClient'

interface ApiResponseWrapper<T> {
  success: boolean
  data: T
}

export interface Notification {
  id: string
  organizationId: string
  userId: string | null
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

interface PaginatedNotifications {
  items: Notification[]
  totalCount: number
}

export const notificationService = {
  async getNotifications(unreadOnly = false, page = 1, pageSize = 20): Promise<PaginatedNotifications> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (unreadOnly) params.append('unreadOnly', 'true')
    const res = await apiClient.get<ApiResponseWrapper<PaginatedNotifications>>(`/api/notifications?${params}`)
    return res.data.data
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<ApiResponseWrapper<{ count: number }>>('/api/notifications/unread-count')
    return res.data.data.count
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient.put(`/api/notifications/${id}/read`)
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.put('/api/notifications/read-all')
  },
}
