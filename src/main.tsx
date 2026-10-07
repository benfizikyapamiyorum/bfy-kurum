import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { App } from './App'
import './stil/temel.css'
import './stil/sayfalar.css'
import './stil/tahta.css'
import { senkronuBaslat } from './depo/senkronKuyrugu'
// Öğrenci cevaplarının kuyruk işleyicisini kaydeder.
import './depo/ogrenciDeposu'
import { ortam } from './yapilandirma/ortam'

// Tek dosya sürümünün adında "sunum" geçiyorsa (Fizik-Kurs-Sistemi-SUNUM.html) dosya doğrudan sunumla açılır.
if (ortam.tekDosya && !window.location.hash && /sunum/i.test(decodeURIComponent(window.location.pathname))) {
  window.location.hash = '#/sunum'
}

createRoot(document.getElementById('kok')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Service worker: uygulama kabuğunu önbelleğe alır, yeni sürüm çıkınca kendiliğinden günceller.
registerSW({ immediate: true })

// Çevrimdışıyken biriken işlemler internet gelince gönderilir.
senkronuBaslat()
