import apiClient from './client'
import type { Review, User } from '../types'

export const reviewsApi = {
  create: (data: { booking_id: string; rating: number; comment: string }) =>
    apiClient.post<Review>('/reviews/', data),

  forHauler: (haulerId: string) =>
    apiClient.get<Review[]>(`/haulers/${haulerId}/reviews/`),

  haulerDetail: (haulerId: string) =>
    apiClient.get<User>(`/haulers/${haulerId}/`),
}
