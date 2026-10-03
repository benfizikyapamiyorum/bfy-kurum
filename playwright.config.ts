import { defineConfig } from '@playwright/test'

// Tahta modu uçtan uca testleri: üretim derlemesi (service worker dahil) üzerinde,
// 1920×1080 dokunmatik ekranda.
export default defineConfig({
  testDir: 'testler/e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 1920, height: 1080 },
    hasTouch: true,
    locale: 'tr-TR',
    serviceWorkers: 'allow',
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
