import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
      interval: 100, // Polls every 100ms for instant hot-reload on Ctrl+S
    },
    hmr: {
      overlay: true,
    },
    fs: {
      strict: false,
      allow: ['..', 'C:/Users/Forgeindiaconnect/.gemini'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
})
