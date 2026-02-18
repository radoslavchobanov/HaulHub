import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, AuthTokens } from '../types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  setAuth: (user: User, tokens: AuthTokens) => void
  setUser: (user: User) => void
  logout: () => void
  isAuthenticated: boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      get isAuthenticated() {
        return !!get().accessToken
      },
      setAuth: (user, tokens) =>
        set({ user, accessToken: tokens.access, refreshToken: tokens.refresh }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: 'haulhub-auth',
    }
  )
)
