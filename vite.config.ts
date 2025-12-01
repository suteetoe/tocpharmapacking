/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  base: '/tocpacking/',
  plugins: [
    vue(),
    VueDevTools(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
  },
  server: {
    port: 8080
  }
})
