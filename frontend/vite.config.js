import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 50392,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:50323',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:50323',
        changeOrigin: true
      }
    }
  }
})
