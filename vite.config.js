// vite.config.js — Vite configuratie voor BYT Studio
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React kern
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Supabase
          'vendor-supabase': ['@supabase/supabase-js'],
          // Charts
          'vendor-charts': ['chart.js', 'react-chartjs-2'],
          // Icons
          'vendor-icons': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
