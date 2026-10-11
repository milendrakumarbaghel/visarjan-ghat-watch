import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The Spring Boot backend serves the API and the source PDFs.
const backend = process.env.BACKEND_URL ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': backend,
      '/reports': backend,
    },
  },
  preview: {
    port: 5173,
    proxy: {
      '/api': backend,
      '/reports': backend,
    },
  },
})
