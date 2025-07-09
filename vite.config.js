import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3008
  },
  define: {
    global: 'globalThis',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})