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

interface OtpResponse {
  message: string
}

interface PhoneVerifyResponse {
  message: string
  user: User
}

interface KycStartResponse {
  dev_mode?: boolean
  message?: string
  already_tier?: string
  client_secret?: string
  verification_session_id?: string
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

  updateUser: (data: Partial<Pick<User, 'first_name' | 'last_name' | 'phone' | 'country' | 'city'>>) =>
    apiClient.patch<User>('/auth/me/', data),

  updateProfile: (data: FormData | Record<string, unknown>) =>
    apiClient.patch<User>('/auth/profile/', data),

  sendOtp: (phone: string) =>
    apiClient.post<OtpResponse>('/auth/phone/send-otp/', { phone }),

  verifyOtp: (phone: string, otp: string) =>
    apiClient.post<PhoneVerifyResponse>('/auth/phone/verify/', { phone, otp }),

  kycStart: () =>
    apiClient.post<KycStartResponse>('/auth/kyc/start/'),
}
