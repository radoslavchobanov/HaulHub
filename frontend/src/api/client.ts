import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const BASE_URL = (import.meta.env.VITE_API_URL || '/api') as string

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const { refreshToken, setAuth, logout, user } = useAuthStore.getState()
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          })
          setAuth(user!, { access: data.access, refresh: refreshToken })
          original.headers.Authorization = `Bearer ${data.access}`
          return apiClient(original)
        } catch {
          logout()
        }
      } else {
        logout()
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
