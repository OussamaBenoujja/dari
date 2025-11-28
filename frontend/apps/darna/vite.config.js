import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@darna/ui-kit': path.resolve(__dirname, '../../packages/ui-kit/src'),
    },
  },
  server: {
    port: 5173,
  },
})
