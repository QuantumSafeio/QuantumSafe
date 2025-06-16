import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/QuantumSafe/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false, // تعطيل source maps لتوفير المساحة
    minify: 'terser', // ضغط أفضل للملفات
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ethers: ['ethers']
        },
        // تقليل أسماء الملفات
        chunkFileNames: 'js/[name]-[hash:8].js',
        entryFileNames: 'js/[name]-[hash:8].js',
        assetFileNames: 'assets/[name]-[hash:8].[ext]'
      }
    },
    // تحسين حجم البناء
    chunkSizeWarningLimit: 1000,
    terserOptions: {
      compress: {
        drop_console: true, // إزالة console.log في الإنتاج
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js', 'ethers']
  },
  // تحسين الذاكرة أثناء التطوير
  server: {
    hmr: {
      overlay: false
    }
  }
});