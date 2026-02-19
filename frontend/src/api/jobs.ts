import apiClient from './client'
import type { Job, JobApplication } from '../types'

export const jobsApi = {
  list: (params: { country?: string; city?: string; category?: string } = {}) => {
    const p: Record<string, string> = {}
    if (params.country)  p.country  = params.country
    if (params.city)     p.city     = params.city
    if (params.category) p.category = params.category
    return apiClient.get<Job[]>('/jobs/', { params: p })
  },

  mine: () => apiClient.get<Job[]>('/jobs/mine/'),

  get: (id: string) => apiClient.get<Job>(`/jobs/${id}/`),

  create: (data: {
    title: string
    description: string
    category: string
    budget: string
    country: string
    city: string
    neighborhood?: string
    scheduled_date: string
  }) => apiClient.post<Job>('/jobs/', data),

  cancel: (id: string) => apiClient.patch<Job>(`/jobs/${id}/`, { action: 'cancel' }),

  getApplications: (jobId: string) =>
    apiClient.get<JobApplication[]>(`/jobs/${jobId}/applications/`),

  apply: (jobId: string, proposal_message: string) =>
    apiClient.post<JobApplication>(`/jobs/${jobId}/applications/`, { proposal_message }),

  getApplication: (appId: string) =>
    apiClient.get<JobApplication>(`/jobs/applications/${appId}/`),

  startChat: (appId: string) =>
    apiClient.patch<JobApplication>(`/jobs/applications/${appId}/`, { action: 'chat' }),

  hire: (appId: string) =>
    apiClient.patch<JobApplication>(`/jobs/applications/${appId}/`, { action: 'hire' }),

  rejectApplication: (appId: string) =>
    apiClient.patch<JobApplication>(`/jobs/applications/${appId}/`, { action: 'reject' }),

  myApplications: () => apiClient.get<JobApplication[]>('/jobs/applications/mine/'),
}
