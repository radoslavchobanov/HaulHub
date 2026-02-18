import apiClient from './client'
import type { Job, JobApplication } from '../types'

export const jobsApi = {
  list: (category?: string) =>
    apiClient.get<Job[]>('/jobs/', { params: category ? { category } : {} }),

  mine: () => apiClient.get<Job[]>('/jobs/mine/'),

  get: (id: string) => apiClient.get<Job>(`/jobs/${id}/`),

  create: (data: {
    title: string
    description: string
    category: string
    budget: string
    location_address: string
    scheduled_date: string
  }) => apiClient.post<Job>('/jobs/', data),

  cancel: (id: string) => apiClient.patch<Job>(`/jobs/${id}/`, { action: 'cancel' }),

  getApplications: (jobId: string) =>
    apiClient.get<JobApplication[]>(`/jobs/${jobId}/applications/`),

  apply: (jobId: string, proposal_message: string) =>
    apiClient.post<JobApplication>(`/jobs/${jobId}/applications/`, { proposal_message }),

  acceptApplication: (appId: string) =>
    apiClient.patch<JobApplication>(`/jobs/applications/${appId}/`, { action: 'accept' }),

  rejectApplication: (appId: string) =>
    apiClient.patch<JobApplication>(`/jobs/applications/${appId}/`, { action: 'reject' }),

  myApplications: () => apiClient.get<JobApplication[]>('/jobs/applications/mine/'),
}
