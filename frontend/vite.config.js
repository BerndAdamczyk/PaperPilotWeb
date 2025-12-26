import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const PROXY_TARGET = process.env.VITE_PROXY_TARGET || 'http://localhost:8000';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: process.env.VITE_ALLOWED_HOSTS
      ? process.env.VITE_ALLOWED_HOSTS.split(',')
      : [],
    proxy: {
      '/api': {
        target: PROXY_TARGET,
        changeOrigin: true
      },
      '/static': {
        target: PROXY_TARGET,
        changeOrigin: true
      }
    }

  }
})

