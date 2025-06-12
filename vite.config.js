import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/QuantumSafe/', // This must match your GitHub Pages repo name
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});