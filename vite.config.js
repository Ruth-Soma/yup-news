import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Charts only used in admin — keep separate
          'vendor-charts': ['recharts'],
          // Date utility
          'vendor-date': ['date-fns'],
          // Supabase client
          'vendor-supabase': ['@supabase/supabase-js'],
          // Helmet
          'vendor-helmet': ['react-helmet-async'],
        },
      },
    },
    // 600 KB warning threshold (from 500 KB default)
    chunkSizeWarningLimit: 600,
  },
})
