import { defineStore } from 'pinia'

import { api } from '@/api'
import { TOKEN_KEY } from '@/api/request'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    username: localStorage.getItem('admin_username') || '',
  }),
  getters: {
    loggedIn: (state) => !!state.token,
  },
  actions: {
    async login(username: string, password: string) {
      const res = await api.login(username, password)
      this.token = res.token
      this.username = username
      localStorage.setItem(TOKEN_KEY, res.token)
      localStorage.setItem('admin_username', username)
    },
    logout() {
      this.token = ''
      this.username = ''
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem('admin_username')
    },
  },
})
