import apiClient from './apiClient'
import { Organization, OrganizationMember } from '@/types'

interface ApiResponseWrapper<T> {
  success: boolean
  data: T
  message: string
  errors: string[]
}

interface OrganizationDetail {
  id: string
  name: string
  email: string
  country: string
  memberCount: number
  createdAt: string
  updatedAt: string
}

interface CreateOrganizationData {
  name: string
  email: string
  country: string
}

interface AddMemberData {
  email: string
  role: string
}

export const organizationService = {
  async createOrganization(data: CreateOrganizationData): Promise<OrganizationDetail> {
    const response = await apiClient.post<ApiResponseWrapper<OrganizationDetail>>('/api/organizations', data)
    return response.data.data
  },

  async getOrganizations(): Promise<Organization[]> {
    const response = await apiClient.get<ApiResponseWrapper<Organization[]>>('/api/organizations')
    return response.data.data
  },

  async getOrganization(id: string): Promise<OrganizationDetail> {
    const response = await apiClient.get<ApiResponseWrapper<OrganizationDetail>>(`/api/organizations/${id}`)
    return response.data.data
  },

  async updateOrganization(id: string, data: CreateOrganizationData): Promise<OrganizationDetail> {
    const response = await apiClient.put<ApiResponseWrapper<OrganizationDetail>>(`/api/organizations/${id}`, data)
    return response.data.data
  },

  async getMembers(orgId: string): Promise<OrganizationMember[]> {
    const response = await apiClient.get<ApiResponseWrapper<OrganizationMember[]>>(`/api/organizations/${orgId}/members`)
    return response.data.data
  },

  async addMember(orgId: string, data: AddMemberData): Promise<OrganizationMember> {
    const response = await apiClient.post<ApiResponseWrapper<OrganizationMember>>(`/api/organizations/${orgId}/members`, data)
    return response.data.data
  },

  async removeMember(orgId: string, userId: string): Promise<void> {
    await apiClient.delete(`/api/organizations/${orgId}/members/${userId}`)
  },
}
