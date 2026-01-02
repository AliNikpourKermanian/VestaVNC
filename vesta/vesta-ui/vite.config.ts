import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/websockify': {
        target: 'ws://localhost:6080',
        ws: true
      },
      '/api': 'http://localhost:6083'
    }
  },
  optimizeDeps: {
    exclude: ['@novnc/novnc']
  }
})
