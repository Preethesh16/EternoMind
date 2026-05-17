import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Proxy /api calls to the backend during development
    // In Docker, VITE_API_URL env var overrides this to http://backend:8000
    proxy: {
      '/api': process.env.VITE_API_URL || 'http://localhost:8000',
    },
  },
})
