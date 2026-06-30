import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In `npm run dev` (no nginx in front), proxy /api -> the local backend so the
// frontend code can always call relative /api/* paths, matching production.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_BACKEND_URL || 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
