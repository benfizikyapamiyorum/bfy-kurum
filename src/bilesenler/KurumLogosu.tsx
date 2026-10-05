import { useSyncExternalStore } from 'react'
import { logoAdresi } from '../depo/kurumDeposu'
import { useOturum } from '../oturum/Oturum'
import { marka } from '../yapilandirma/marka'
import { abone, denemeLogosuOku } from './denemeLogosu'

// Kurum logosu: oturumdaki kullanıcının kurumunun logosu (Storage), yoksa bu tarayıcıda denenen logo,
// o da yoksa kurumun adı.
export function KurumLogosu({ sinif = '' }: { sinif?: string }) {
  const { kurum, sunucuVar } = useOturum()
  const deneme = useSyncExternalStore(abone, denemeLogosuOku, () => null)
  const adres = (sunucuVar && kurum?.logo_yolu ? logoAdresi(kurum.logo_yolu) : null) ?? deneme
  const ad = kurum?.ad ?? marka.demoKurumAdi
  return (
    <div className={`kurum-logosu ${sinif}`} aria-label="Kurum logosu">
      {adres ? <img src={adres} alt={ad} /> : <span>{ad}</span>}
    </div>
  )
}
