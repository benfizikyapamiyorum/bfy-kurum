import { useSyncExternalStore } from 'react'
import { abone, denemeLogosuOku } from './denemeLogosu'
import { marka } from '../yapilandirma/marka'

// M2'ye kadar kurum logosu Ayarlar ekranından bu tarayıcı için denenebilir.
// M2'de oturumdaki kullanıcının kurumunun logosu (Storage: logolar/<kurum_id>/...) gösterilecek.

export function KurumLogosu({ sinif = '' }: { sinif?: string }) {
  const logo = useSyncExternalStore(abone, denemeLogosuOku, () => null)
  return (
    <div className={`kurum-logosu ${sinif}`} aria-label="Kurum logosu">
      {logo ? <img src={logo} alt={marka.demoKurumAdi} /> : <span>{marka.demoKurumAdi}</span>}
    </div>
  )
}
