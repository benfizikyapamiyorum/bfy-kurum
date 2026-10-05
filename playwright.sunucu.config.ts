import { defineConfig } from '@playwright/test'

// Sunucu (Supabase) gerektiren uçtan uca testler. Önce yerel Supabase başlatılır:
//   npx supabase start
//   npm run test:e2e:sunucu
// Testler her çalıştırmada kendi kurumunu ve hesaplarını service_role ile açar.

const URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const ANAHTAR = process.env.SUPABASE_ANON_KEY ?? 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

export default defineConfig({
  testDir: 'testler/e2e-sunucu',
  timeout: 90_000,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4174',
    viewport: { width: 1366, height: 900 },
    locale: 'tr-TR',
  },
  webServer: {
    command: `npx vite build --outDir dist-sunucu --emptyOutDir && npx vite preview --outDir dist-sunucu --port 4174 --strictPort`,
    url: 'http://localhost:4174',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { VITE_SUPABASE_URL: URL, VITE_SUPABASE_ANON_KEY: ANAHTAR },
  },
})
