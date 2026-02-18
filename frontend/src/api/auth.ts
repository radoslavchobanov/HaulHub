import apiClient from './client'
import type { User, AuthTokens } from '../types'

interface AuthResponse {
  user: User
  tokens: AuthTokens
}

interface GoogleAuthResponse extends AuthResponse {
  requires_type?: boolean
  email?: string
  first_name?: string
  last_name?: string
}

export const authApi = {
  register: (data: {
    email: string
    password: string
    first_name: string
    last_name: string
    phone?: string
    user_type: 'client' | 'hauler'
  }) => apiClient.post<AuthResponse>('/auth/register/', data),

  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/login/', { email, password }),

  googleAuth: (token: string, user_type?: string) =>
    apiClient.post<GoogleAuthResponse>('/auth/google/', { token, user_type }),

  me: () => apiClient.get<User>('/auth/me/'),

  updateProfile: (data: FormData | Record<string, unknown>) =>
    apiClient.patch<User>('/auth/profile/', data),
}
