import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null')
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    isHost: (state) => state.user?.role === 'host',
    isGuest: (state) => state.user?.role === 'guest'
  },
  actions: {
    setAuth(token, user) {
      this.token = token
      this.user = user
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    updateUser(user) {
      this.user = { ...this.user, ...user }
      localStorage.setItem('user', JSON.stringify(this.user))
    },
    checkAuth() {
      const token = localStorage.getItem('token')
      if (token) {
        this.token = token
        this.user = JSON.parse(localStorage.getItem('user') || 'null')
      }
    }
  }
})
