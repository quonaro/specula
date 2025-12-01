import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig(({ mode }) => {
  // Get base path from environment variable, default to '/' for development
  const base = process.env.VITE_BASE_PATH || '/';

  return {
    base,
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [vue()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // Enable minification
      minify: 'esbuild',
      // Optimize chunk splitting
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Separate vendor chunks
            if (id.includes('node_modules')) {
              // Vue core libraries
              if (id.includes('vue') && !id.includes('vue-toastification') && !id.includes('lucide')) {
                return 'vue-vendor'
              }
              // Router and state management
              if (id.includes('vue-router') || id.includes('pinia')) {
                return 'vue-vendor'
              }
              // UI libraries
              if (id.includes('lucide-vue-next') || id.includes('vue-toastification')) {
                return 'ui-vendor'
              }
              // Utility libraries
              if (id.includes('jszip') || id.includes('@vueuse/core')) {
                return 'utils'
              }
              // Other node_modules
              return 'vendor'
            }
            // Split large components
            if (id.includes('/components/OperationView.vue')) {
              return 'operation-view'
            }
            if (id.includes('/components/FileUpload.vue')) {
              return 'file-upload'
            }
            if (id.includes('/pages/Index.vue')) {
              return 'index-page'
            }
          },
          // Optimize chunk file names
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.')
            const ext = info[info.length - 1]
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`
            }
            if (/woff2?|eot|ttf|otf/i.test(ext)) {
              return `assets/fonts/[name]-[hash][extname]`
            }
            return `assets/[ext]/[name]-[hash][extname]`
          },
        },
      },
      // Optimize asset handling
      assetsInlineLimit: 4096, // Inline assets smaller than 4kb
      // Enable source maps for production debugging (optional)
      sourcemap: false,
      // Optimize CSS
      cssCodeSplit: true,
      // Tree-shaking optimization
      target: 'esnext',
      // Optimize build performance
      reportCompressedSize: true,
      // Chunk size warning limit (reduced for better optimization)
      chunkSizeWarningLimit: 600,
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['vue', 'vue-router', 'pinia', 'lucide-vue-next'],
      // Exclude large dependencies from pre-bundling if needed
      exclude: [],
    },
    // Build optimization
    esbuild: {
      // Drop console and debugger in production
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
  };
});
