// Yerel deneme modu: katalog ve örnek sorular uygulamanın içinde gelir, sunucu gerekmez.

import type { Icerik, Katalog, Soru } from '../alan/tipler'
import { katalog } from '../veri/katalog'
import { ornekIcerikler } from '../veri/ornekIcerik'
import { ornekSorular } from '../veri/ornekSorular'
import { statikDosyaGetir, type IcerikKaynagi } from './kaynak'

export class YerelKaynak implements IcerikKaynagi {
  readonly ad = 'yerel' as const

  async katalog(): Promise<Katalog> {
    return katalog
  }

  async uniteSorulari(_uniteId: string, kazanimIdleri: string[]): Promise<Soru[]> {
    const k = new Set(kazanimIdleri)
    return ornekSorular.filter((s) => s.kazanim_idleri.some((id) => k.has(id)))
  }

  async uniteIcerikleri(uniteId: string): Promise<Icerik[]> {
    return ornekIcerikler.filter((i) => i.unite_id === uniteId)
  }

  async icerik(id: string): Promise<Icerik | null> {
    return ornekIcerikler.find((i) => i.id === id) ?? null
  }

  async kitHtml(icerik: Icerik): Promise<string> {
    if (!icerik.html_yolu?.startsWith('/')) throw new Error('Bu kit yerel modda açılamaz.')
    return statikDosyaGetir(icerik.html_yolu)
  }
}
