import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: [
        '@capacitor-community/bluetooth-le',
        '@capacitor-community/http'
      ]
    }
  }
})