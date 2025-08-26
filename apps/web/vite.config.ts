import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React ecosystem
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          
          // UI libraries
          'radix-ui': [
            '@radix-ui/react-avatar',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-tabs'
          ],
          
          // Chart and visualization libraries
          'charts': ['recharts'],
          'flow': ['reactflow'],
          
          // Form libraries
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          
          // Utility libraries
          'utils': [
            'axios',
            'clsx',
            'class-variance-authority',
            'tailwind-merge',
            'html-to-image'
          ],
          
          // Icons
          'icons': ['lucide-react'],
          
          // Notifications
          'notifications': ['sonner']
        }
      }
    },
    // Increase the chunk size warning limit to 1000kb to reduce noise
    // while still catching truly problematic chunks
    chunkSizeWarningLimit: 1000
  }
})
