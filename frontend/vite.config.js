import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
<<<<<<< HEAD
    open: true,
    hmr: {
      overlay: false
    }
  },
=======
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4
})