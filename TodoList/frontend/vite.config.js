import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync('../backend/certs/key.pem'),
      cert: fs.readFileSync('../backend/certs/cert.pem'),
    },
    port: 5173,

    proxy: {
      '/api': {
        target: 'https://localhost:3443',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
