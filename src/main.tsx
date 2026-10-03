import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { App } from './App'
import './stil/temel.css'
import './stil/sayfalar.css'

createRoot(document.getElementById('kok')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Service worker: uygulama kabuğunu önbelleğe alır, yeni sürüm çıkınca kendiliğinden günceller.
registerSW({ immediate: true })
