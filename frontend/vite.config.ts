import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://splitzee-backend-d9d6f4a7cagncscb.eastasia-01.azurewebsites.net',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
