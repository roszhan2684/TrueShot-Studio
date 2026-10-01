import axios, { type AxiosError, type AxiosInstance } from 'axios'
import { API_URL } from '@/lib/constants'

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: `${API_URL}/api/v1`,
    headers: { 'Content-Type': 'application/json' },
    timeout: 60000,
  })

  // Demo mode — send a fixed demo user email so the backend can resolve/create the user
  client.interceptors.request.use((config) => {
    config.headers['X-Demo-User'] = 'demo@trueshot.ai'
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const detail = (error.response?.data as { detail?: string })?.detail
      if (detail) {
        const enhanced = new Error(detail) as Error & { status: number }
        enhanced.status = error.response?.status ?? 500
        return Promise.reject(enhanced)
      }
      return Promise.reject(error)
    }
  )

  return client
}

export const apiClient = createApiClient()
