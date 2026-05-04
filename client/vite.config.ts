import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// In local dev the proxy forwards /api → localhost:3001.
// In production (Vercel) the frontend calls VITE_API_URL directly.
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  server:
    mode === 'development'
      ? {
          port: 5173,
          proxy: {
            '/api': {
              target: 'http://localhost:3001',
              changeOrigin: true,
            },
          },
        }
      : { port: 5173 },
}));
