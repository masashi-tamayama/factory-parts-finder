import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // 開発中は /api で始まる依頼を FastAPI に転送する(本番と同じ URL の形にするため)
      '/api': 'http://127.0.0.1:8000',
    },
  },
})
