import { useEffect, useState } from 'react'
import { Simge } from '../bilesenler/Simge'

/** Soru başına süre. sifirlaAnahtari değişince sıfırlanır ve yeniden başlar. */
export function Sayac({ sifirlaAnahtari }: { sifirlaAnahtari: string }) {
  const [gecen, setGecen] = useState(0)
  const [calisiyor, setCalisiyor] = useState(true)
  const [oncekiAnahtar, setOncekiAnahtar] = useState(sifirlaAnahtari)

  if (oncekiAnahtar !== sifirlaAnahtari) {
    setOncekiAnahtar(sifirlaAnahtari)
    setGecen(0)
    setCalisiyor(true)
  }

  useEffect(() => {
    if (!calisiyor) return
    const baslangic = Date.now() - gecen * 1000
    const z = window.setInterval(() => setGecen(Math.floor((Date.now() - baslangic) / 1000)), 250)
    return () => window.clearInterval(z)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calisiyor, sifirlaAnahtari])

  const dk = Math.floor(gecen / 60)
  const sn = gecen % 60
  return (
    <div className={`sayac ${calisiyor ? '' : 'durdu'}`} role="timer" aria-label="Soru süresi">
      <span className="sayac-deger">
        {String(dk).padStart(2, '0')}:{String(sn).padStart(2, '0')}
      </span>
      <button
        type="button"
        className="dugme sade"
        onClick={() => setCalisiyor((c) => !c)}
        aria-label={calisiyor ? 'Süreyi durdur' : 'Süreyi başlat'}
      >
        <Simge ad={calisiyor ? 'durdur' : 'oynat'} />
      </button>
      <button
        type="button"
        className="dugme sade"
        onClick={() => {
          setGecen(0)
          setCalisiyor(true)
        }}
        aria-label="Süreyi sıfırla"
      >
        <Simge ad="yenile" />
      </button>
    </div>
  )
}
