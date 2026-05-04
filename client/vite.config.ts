import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Base path matches the GitHub repo name for GitHub Pages.
// In local dev (mode === 'development') base stays '/' so the dev server works normally.
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  base: mode === 'production' ? '/Configurationtool/' : '/',
  server: {
    port: 5173,
  },
}));
