import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Set VITE_BASE=/Posture/ in CI to deploy under a GitHub Pages subpath.
  base: process.env.VITE_BASE || '/',
  define: {
    __BUILD_ID__: JSON.stringify(new Date().toISOString().replace('T', ' ').slice(0, 16)),
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'PostureLab',
        short_name: 'PostureLab',
        description: 'Analyze posture from photos with AI landmark detection.',
        theme_color: '#0ea5e9',
        background_color: '#0b1120',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: { maximumFileSizeToCacheInBytes: 30 * 1024 * 1024 },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
