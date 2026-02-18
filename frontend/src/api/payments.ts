import apiClient from './client'
import type { Wallet } from '../types'

export const paymentsApi = {
  getWallet: () => apiClient.get<Wallet>('/wallet/'),
  deposit: (amount: string) => apiClient.post<{ checkout_url: string }>('/wallet/deposit/', { amount }),
}
