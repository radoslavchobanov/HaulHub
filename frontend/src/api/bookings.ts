import apiClient from './client'
import type { Booking, JobEvidence, JobAmendment } from '../types'

export const bookingsApi = {
  get: (id: string) => apiClient.get<Booking>(`/bookings/${id}/`),
  mine: () => apiClient.get<Booking[]>('/bookings/mine/'),

  confirmPickup: (id: string, pin: string) =>
    apiClient.post<Booking>(`/bookings/${id}/confirm-pickup/`, { pin }),

  uploadEvidence: (id: string, data: FormData) =>
    apiClient.post<JobEvidence>(`/bookings/${id}/evidence/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  markDone: (id: string) =>
    apiClient.post<Booking>(`/bookings/${id}/mark-done/`),

  complete: (id: string) =>
    apiClient.post<Booking>(`/bookings/${id}/complete/`),

  openDispute: (id: string, reason: string) =>
    apiClient.post<Booking>(`/bookings/${id}/dispute/`, { reason }),

  reportNoShow: (id: string) =>
    apiClient.post<Booking>(`/bookings/${id}/no-show/`),

  requestAmendment: (id: string, proposed_budget: string, reason: string) =>
    apiClient.post<JobAmendment>(`/bookings/${id}/amendments/`, { proposed_budget, reason }),

  respondToAmendment: (bookingId: string, amendmentId: string, action: 'accept' | 'reject') =>
    apiClient.patch<JobAmendment>(`/bookings/${bookingId}/amendments/${amendmentId}/`, { action }),
}
