import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import marka from './src/yapilandirma/marka.json'

// index.html içindeki %URUN_ADI% yer tutucusunu marka.json'dan doldurur.
const markaHtml = (): Plugin => ({
  name: 'marka-html',
  transformIndexHtml: (html) => html.replaceAll('%URUN_ADI%', marka.urunAdi),
})

export default defineConfig({
  plugins: [
    react(),
    markaHtml(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['simge.svg'],
      manifest: {
        name: marka.urunAdi,
        short_name: marka.urunKisaAdi,
        lang: 'tr',
        start_url: '/',
        display: 'standalone',
        background_color: '#f5f7fa',
        theme_color: marka.anaRenk,
        icons: [
          { src: '/simge-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/simge-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/simge-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/simge.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        // Uygulama kabuğu her zaman önbellekte. Yalnızca Türkçe için gereken yazı tipi dosyaları alınır.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}', '**/inter-latin*.woff2', '**/KaTeX_*.woff2'],
        // İçerik dosyaları (HTML kitler) kabuğa girmez; öğretmen "Tahtaya indir" ile kendisi seçer.
        globIgnores: ['ornek/**'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/ornek\//],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
  },
})
