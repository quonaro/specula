import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { logoBase64Plugin } from "./vite-plugin-logo-base64";

export default defineConfig({
    base: './',
    plugins: [vue(), logoBase64Plugin()],
    define: {
        // Disable backend checking in standalone version
        'import.meta.env.VITE_WITHOUT_BACKEND': '"true"',
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        rollupOptions: {
            input: path.resolve(__dirname, 'src/standalone.ts'),
            output: {
                // Single bundle - no chunk splitting
                inlineDynamicImports: true,
                format: 'iife',
                // Don't set name here - we manually assign to window.Specula in the code
                // Single file output
                entryFileNames: 'specula.js',
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name && assetInfo.name.endsWith('.css')) {
                        return 'specula.css'
                    }
                    // Inline images as base64 for standalone bundle
                    if (/\.(png|jpg|jpeg|svg|gif)$/.test(assetInfo.name || '')) {
                        // Return a placeholder - assets will be inlined
                        return 'assets/[name][extname]'
                    }
                    return 'assets/[name][extname]'
                }
            }
        },
        // Inline assets up to 500KB for standalone (to include logo)
        assetsInlineLimit: 500000,
        // Minify
        minify: 'esbuild',
        // Disable source maps for smaller size (can enable if needed)
        sourcemap: false,
        // Inline CSS instead of splitting
        cssCodeSplit: false,
        // Tree-shaking optimization
        target: 'esnext',
        // Increase chunk size limit for standalone
        chunkSizeWarningLimit: 2000,
        // Don't minify CSS separately (will be inlined)
        cssMinify: true,
    },
    optimizeDeps: {
        include: ['vue', 'vue-router', 'pinia', 'lucide-vue-next'],
    },
    esbuild: {
        drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
});

