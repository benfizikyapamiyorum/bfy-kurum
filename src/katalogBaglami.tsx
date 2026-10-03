import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { Katalog, Kazanim, Seviye, Unite } from './alan/tipler'
import { katalogGetir } from './depo/depo'
import { useVeri } from './kancalar'

export interface KatalogYardimcisi {
  katalog: Katalog
  seviyeKoddan: (kod: string) => Seviye | undefined
  seviyeninUniteleri: (seviyeId: string) => Unite[]
  unite: (id: string) => Unite | undefined
  uniteninKazanimlari: (uniteId: string) => Kazanim[]
  kazanim: (id: string) => Kazanim | undefined
}

const Baglam = createContext<{ yardimci: KatalogYardimcisi | null; hata: Error | null; yenile: () => void } | null>(
  null,
)

export function KatalogSaglayici({ children }: { children: ReactNode }) {
  const { veri, hata, yenile } = useVeri(katalogGetir, [])
  const yardimci = useMemo<KatalogYardimcisi | null>(() => {
    if (!veri) return null
    const kazanimMap = new Map(veri.kazanimlar.map((k) => [k.id, k]))
    return {
      katalog: veri,
      seviyeKoddan: (kod) => veri.seviyeler.find((s) => s.kod === kod),
      seviyeninUniteleri: (id) => veri.uniteler.filter((u) => u.seviye_id === id).sort((a, b) => a.no - b.no),
      unite: (id) => veri.uniteler.find((u) => u.id === id),
      uniteninKazanimlari: (id) => veri.kazanimlar.filter((k) => k.unite_id === id).sort((a, b) => a.sira - b.sira),
      kazanim: (id) => kazanimMap.get(id),
    }
  }, [veri])
  return <Baglam.Provider value={{ yardimci, hata, yenile }}>{children}</Baglam.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useKatalog() {
  const b = useContext(Baglam)
  if (!b) throw new Error('useKatalog yalnızca KatalogSaglayici içinde kullanılabilir.')
  return b
}
