import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/QuantumSafe/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});