// Sunumdan canlı ekrana geçildiğinde ekranın sağ kenarında duran "Sunuma dön" düğmesi.
// Yönlendiricinin dışında durur, bu yüzden adres değişimini kendisi dinler.

import { useEffect, useState } from 'react'
import { Simge } from '../bilesenler/Simge'
import { ortam } from '../yapilandirma/ortam'
import { sunumAdimi, sunumAdiminiKaydet, sunumDinle } from './sunumDurumu'

const yol = () => (ortam.tekDosya ? window.location.hash.replace(/^#/, '') || '/' : window.location.pathname)

export function SunumDonusu() {
  const [, yenile] = useState(0)
  useEffect(() => {
    const f = () => yenile((n) => n + 1)
    window.addEventListener('hashchange', f)
    window.addEventListener('popstate', f)
    const birak = sunumDinle(f)
    // React Router geçmişi pushState ile değiştirir; olay çıkmadığı için adres kısa aralıkla kontrol edilir.
    const t = window.setInterval(f, 500)
    return () => {
      window.removeEventListener('hashchange', f)
      window.removeEventListener('popstate', f)
      birak()
      window.clearInterval(t)
    }
  }, [])

  const adim = sunumAdimi()
  if (adim === null || yol().startsWith('/sunum')) return null

  const don = () => {
    const hedef = `/sunum?adim=${adim}`
    sunumAdiminiKaydet(null)
    if (ortam.tekDosya) window.location.hash = `#${hedef}`
    else {
      window.history.pushState({}, '', hedef)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  return (
    <button type="button" className="sunuma-don" onClick={don}>
      <Simge ad="geri" />
      Sunuma dön
    </button>
  )
}
