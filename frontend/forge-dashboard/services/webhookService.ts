import apiClient from './apiClient'

interface ApiResponseWrapper<T> {
  success: boolean
  data: T
}

export interface WebhookEndpoint {
  id: string
  url: string
  events: string[]
  secret: string
  isActive: boolean
  createdAt: string
}

export interface WebhookDelivery {
  id: string
  event: string
  payload: string
  statusCode: number | null
  response: string | null
  deliveredAt: string | null
  attempts: number
  createdAt: string
}

export const webhookService = {
  async registerWebhook(data: { url: string; events: string[] }): Promise<WebhookEndpoint> {
    const res = await apiClient.post<ApiResponseWrapper<WebhookEndpoint>>('/api/webhooks', data)
    return res.data.data
  },

  async getWebhooks(): Promise<WebhookEndpoint[]> {
    const res = await apiClient.get<ApiResponseWrapper<WebhookEndpoint[]>>('/api/webhooks')
    return res.data.data
  },

  async removeWebhook(id: string): Promise<void> {
    await apiClient.delete(`/api/webhooks/${id}`)
  },

  async testWebhook(id: string): Promise<void> {
    await apiClient.post(`/api/webhooks/${id}/test`)
  },

  async getDeliveries(webhookId: string): Promise<WebhookDelivery[]> {
    const res = await apiClient.get<ApiResponseWrapper<WebhookDelivery[]>>(`/api/webhooks/${webhookId}/deliveries`)
    return res.data.data
  },

  async retryDelivery(deliveryId: string): Promise<void> {
    await apiClient.post(`/api/webhooks/deliveries/${deliveryId}/retry`)
  },
}
