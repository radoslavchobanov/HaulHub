import apiClient from './client'
import type { Booking } from '../types'

export const bookingsApi = {
  get: (id: string) => apiClient.get<Booking>(`/bookings/${id}/`),
  mine: () => apiClient.get<Booking[]>('/bookings/mine/'),
  complete: (id: string) => apiClient.post<Booking>(`/bookings/${id}/complete/`),
}
