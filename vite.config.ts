import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { viteSingleFile } from 'vite-plugin-singlefile'
import marka from './src/yapilandirma/marka.json'

// index.html içindeki %URUN_ADI% yer tutucusunu marka.json'dan doldurur.
const markaHtml = (): Plugin => ({
  name: 'marka-html',
  transformIndexHtml: (html) => html.replaceAll('%URUN_ADI%', marka.urunAdi),
})

// Tanıtım (flash bellek) sürümünde service worker yok; kayıt fonksiyonu boş bir modüle bağlanır.
const pwaYok = (): Plugin => ({
  name: 'pwa-yok',
  resolveId: (id) => (id === 'virtual:pwa-register' ? '\0pwa-yok' : null),
  load: (id) => (id === '\0pwa-yok' ? 'export function registerSW() { return () => {} }' : null),
})

// npm run build:tanitim → dist-tanitim/index.html: tek dosya, internetsiz, sunucusuz, çift tıkla açılır.
const tanitimSurumu = defineConfig({
  plugins: [react(), markaHtml(), pwaYok(), viteSingleFile({ removeViteModuleLoader: true })],
  base: './',
  // Tek dosya: yanında klasör taşımasın (örnek kit pakete gömülü).
  publicDir: false,
  define: {
    'import.meta.env.VITE_TANITIM': JSON.stringify('1'),
    'import.meta.env.VITE_TEK_DOSYA': JSON.stringify('1'),
    // Geliştirme makinesindeki .env.local sunucu bilgisi tanıtım dosyasına sızmasın.
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(''),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(''),
  },
  build: {
    // Eski tarayıcılar da açabilsin (akıllı tahtalarda güncellenmemiş tarayıcı sık görülür).
    target: ['es2019', 'safari13', 'chrome80', 'firefox78', 'edge88'],
    outDir: 'dist-tanitim',
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 100_000,
    // Çıkan modül betiğini scripts/tanitim-son-islem.mjs klasik betiğe çevirip sayfanın sonuna taşır.
  },
})

const webSurumu = defineConfig({
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
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}', '**/inter-latin*.woff2', '**/inter-greek-wght*.woff2', '**/KaTeX_*.woff2'],
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

export default defineConfig(({ mode }) => (mode === 'tanitim' ? tanitimSurumu : webSurumu))
