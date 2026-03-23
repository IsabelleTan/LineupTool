import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/players': 'http://localhost:8000',
      '/games':   'http://localhost:8000',
      '/lineups': 'http://localhost:8000',
      '/import':  'http://localhost:8000',
    },
  },
})
