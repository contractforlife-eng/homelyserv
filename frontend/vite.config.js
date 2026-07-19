// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      '@react-oauth/google',
      // Remove these if you're not using them:
      // 'react-facebook-login',  // REMOVED - not needed anymore
      // 'react-apple-signin-auth' // Remove if not using Apple Sign In
    ],
    // Force re-optimization
    force: true
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'https://gas-clapped-copper.ngrok-free.dev',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    },
    // Add this to help with HMR
    hmr: {
      overlay: true
    }
  },
  // Add this to handle large dependencies
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      extensions: ['.js', '.cjs', '.mjs']
    }
  }
});