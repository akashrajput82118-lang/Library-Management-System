import axios from 'axios'

export const TOKEN_KEY = 'library_admin_token'
export const USER_KEY = 'library_admin_username'

const baseURL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
).replace(/\/$/, '')

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !isLoginRequest) {
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(USER_KEY)
      window.dispatchEvent(new Event('library:unauthorized'))
    }
    return Promise.reject(error)
  }
)

export function getErrorMessage(error) {
  const data = error.response?.data

  if (data?.fieldErrors) {
    const first = Object.values(data.fieldErrors).find(Boolean)
    if (first) return first
  }

  if (data?.message) return data.message

  if (error.code === 'ECONNABORTED') {
    return 'The server took too long to respond. Please try again.'
  }

  if (!error.response) {
    return `Cannot reach the backend at ${baseURL}. Is Spring Boot running?`
  }

  if (error.response.status === 403) {
    return 'You are not allowed to perform this action.'
  }

  if (error.response.status === 401) {
    return 'Your session is invalid or expired. Please log in again.'
  }

  return 'Something went wrong. Please try again.'
}

export default api
