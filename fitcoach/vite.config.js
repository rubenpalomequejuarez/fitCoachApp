import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API = process.env.FITCOACH_API || 'http://localhost:3001';

export default defineConfig({
  root: 'client',
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': API,
      '/uploads': API,
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
