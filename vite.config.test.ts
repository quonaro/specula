import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// Test configuration - runs Specula with petstore API for testing
export default defineConfig({
  base: '/',
  root: '.',
  server: {
    host: '::',
    port: 8081, // Different port to avoid conflicts
    open: '/index.test.html',
  },
  plugins: [vue()],
  define: {
    'import.meta.env.VITE_EXAMPLE': JSON.stringify('true'),
    'import.meta.env.VITE_BASE_PATH': JSON.stringify('/'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist-test',
    minify: false, // Don't minify for easier debugging
    sourcemap: true,
  },
})

