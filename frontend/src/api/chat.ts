import apiClient from './client'
import type { ChatRoom, Message } from '../types'

export const chatApi = {
  rooms: () => apiClient.get<ChatRoom[]>('/chat/rooms/'),
  messages: (roomId: string) => apiClient.get<Message[]>(`/chat/rooms/${roomId}/messages/`),
}
