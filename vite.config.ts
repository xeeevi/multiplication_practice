import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // base: './' makes all asset paths relative so the app works
  // at any GitHub Pages subpath (e.g. /repo-name/)
  base: './',
})
