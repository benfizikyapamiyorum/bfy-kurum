import { createContext, useContext, type ReactNode } from 'react'
import type { Kurum, SinifGrubu } from '../alan/tipler'
import { kurumKullanicilari, siniflar, type KurumKullanicisi } from '../depo/kurumDeposu'
import { useVeri } from '../kancalar'

export interface KurumVerisi {
  kurum: Kurum
  kullanicilar: KurumKullanicisi[]
  siniflar: SinifGrubu[]
  yenile: () => void
}

const Baglam = createContext<KurumVerisi | null>(null)

export function KurumVerisiSaglayici({ kurum, children }: { kurum: Kurum; children: ReactNode }) {
  const v = useVeri(
    async () => {
      const [k, s] = await Promise.all([kurumKullanicilari(kurum.id), siniflar(kurum.id)])
      return { kullanicilar: k, siniflar: s }
    },
    [kurum.id],
  )
  if (v.hata) return <p className="hata-metni">Veriler alınamadı: {v.hata.message}</p>
  if (!v.veri) return <p className="soluk">Yükleniyor.</p>
  return <Baglam.Provider value={{ kurum, ...v.veri, yenile: v.yenile }}>{children}</Baglam.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useKurumVerisi(): KurumVerisi {
  const k = useContext(Baglam)
  if (!k) throw new Error('useKurumVerisi yalnızca KurumVerisiSaglayici içinde kullanılabilir.')
  return k
}
