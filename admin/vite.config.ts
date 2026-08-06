import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  define: {
    // In dev, forward /api/* through the proxy above — no CORS issues.
    'import.meta.env.VITE_API_URL': JSON.stringify('/api'),
  },
  test: {
    globals: false,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    env: { VITE_API_URL: 'http://localhost:3000/api' },
  },
});
