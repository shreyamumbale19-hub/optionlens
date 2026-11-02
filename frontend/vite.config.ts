import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Vite configuration for the OptionLens frontend
export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
