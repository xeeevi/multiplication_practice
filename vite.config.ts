import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// viteSingleFile inlines all JS and CSS into index.html so the output is
// a single self-contained file — works when opened directly via file:// or
// served from GitHub Pages.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  build: {
    // Inline everything regardless of size
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
