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
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'PostureLab',
        short_name: 'PostureLab',
        description: 'Analyze posture from photos with AI landmark detection.',
        theme_color: '#0ea5e9',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Keep the precache to the app shell. The ~27MB pose model + wasm are
        // NOT precached (that made every first visit download 24MB before the
        // app was usable); they're runtime-cached on the first analysis instead.
        globIgnores: ['**/models/**'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/models/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'posture-model',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
