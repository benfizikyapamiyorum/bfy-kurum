import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { App } from './App'
import './stil/temel.css'
import './stil/sayfalar.css'
import './stil/tahta.css'
import { senkronuBaslat } from './depo/senkronKuyrugu'

createRoot(document.getElementById('kok')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Service worker: uygulama kabuğunu önbelleğe alır, yeni sürüm çıkınca kendiliğinden günceller.
registerSW({ immediate: true })

// Çevrimdışıyken biriken işlemler internet gelince gönderilir.
senkronuBaslat()
