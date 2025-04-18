import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Auth & user endpoints on your Go backend (port 4000)
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/auth': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/login': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/register': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/logout': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/profile': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },

      // Clone endpoint on your containerized clone‑service (port 4001)
      '/clone': {
        target: 'http://localhost:4001',
        changeOrigin: true,
      },
    },
  },
});
