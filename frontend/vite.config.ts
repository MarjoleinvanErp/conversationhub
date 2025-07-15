import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/types': resolve(__dirname, './src/types'),
      '@/services': resolve(__dirname, './src/services'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/utils': resolve(__dirname, './src/utils'),
    },
  },
  // Optimize voor development
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios', '@mui/material', '@emotion/react', '@emotion/styled'],
  },
  // Build configuration
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    // Chunk splitting voor betere loading performance
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@emotion/react', '@emotion/styled'],
          utils: ['axios', '@tanstack/react-query'],
        },
      },
    },
  },
})