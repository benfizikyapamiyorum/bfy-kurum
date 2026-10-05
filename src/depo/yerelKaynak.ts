// Yerel deneme modu: katalog ve örnek sorular uygulamanın içinde gelir, sunucu gerekmez.

import type { Icerik, Katalog, Soru } from '../alan/tipler'
import { katalog } from '../veri/katalog'
import { ornekIcerikler } from '../veri/ornekIcerik'
import { ornekSorular } from '../veri/ornekSorular'
import { ortam } from '../yapilandirma/ortam'
import { statikDosyaGetir, type IcerikKaynagi } from './kaynak'

// Tanıtım sürümünde ek paket; normal derlemede bu dal tamamen çıkarılır.
const ek = () => (ortam.tanitim ? import('../veri/tanitimPaketi') : Promise.resolve(null))
// Tek dosya sürümünde örnek kit dosyadan okunamaz (file://); metni pakete gömülür.
const gomuluKit = () => (ortam.tekDosya ? import('../../public/ornek/ornek-hafta-kiti.html?raw').then((m) => m.default) : Promise.resolve(null))

export class YerelKaynak implements IcerikKaynagi {
  readonly ad = 'yerel' as const

  async katalog(): Promise<Katalog> {
    const e = await ek()
    if (!e) return katalog
    return { ...katalog, uniteler: [...katalog.uniteler, ...e.tanitimUniteleri], kazanimlar: [...katalog.kazanimlar, ...e.tanitimKazanimlari] }
  }

  private async sorular(): Promise<Soru[]> {
    const e = await ek()
    return e ? [...ornekSorular, ...e.tanitimSorulari] : ornekSorular
  }

  private async icerikler(): Promise<Icerik[]> {
    const e = await ek()
    return e ? [...ornekIcerikler, ...e.tanitimIcerikleri] : ornekIcerikler
  }

  async uniteSorulari(_uniteId: string, kazanimIdleri: string[]): Promise<Soru[]> {
    const k = new Set(kazanimIdleri)
    return (await this.sorular()).filter((s) => s.kazanim_idleri.some((id) => k.has(id)))
  }

  async uniteIcerikleri(uniteId: string): Promise<Icerik[]> {
    return (await this.icerikler()).filter((i) => i.unite_id === uniteId)
  }

  async icerik(id: string): Promise<Icerik | null> {
    return (await this.icerikler()).find((i) => i.id === id) ?? null
  }

  async kitHtml(icerik: Icerik): Promise<string> {
    if (!icerik.html_yolu?.startsWith('/')) throw new Error('Bu kit yerel modda açılamaz.')
    const gomulu = await gomuluKit()
    if (gomulu !== null) return gomulu
    return statikDosyaGetir(icerik.html_yolu)
  }
}
