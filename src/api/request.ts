import axios from 'axios'
import { ElMessage } from 'element-plus'

export const TOKEN_KEY = 'admin_token'

// 后端 API 地址：默认同源（开发时走 vite 代理）；部署时通过 VITE_API_BASE 指定，
// 如 VITE_API_BASE=https://api.example.com
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '',
  timeout: 180000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (resp) => resp,
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      if (!location.hash.includes('/login')) location.hash = '#/login'
      ElMessage.error('未授权或登录已过期')
    } else {
      const detail = error?.response?.data?.detail
      ElMessage.error(typeof detail === 'string' ? detail : error?.message || '请求失败')
    }
    return Promise.reject(error)
  },
)
