// Supabase kaynağı. Erişim kuralları veritabanındaki RLS politikalarıyla belirlenir:
// giriş yapmamış ziyaretçi yalnızca örnek içeriği, lisanslı öğretmen tüm yayındaki içeriği görür.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Icerik, Katalog, Soru } from '../alan/tipler'
import { statikDosyaGetir, type IcerikKaynagi } from './kaynak'

const KIT_KOVASI = 'icerik'

function hataVarsa<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message)
  return r.data as T
}

type SoruSatiri = Omit<Soru, 'kazanim_idleri'> & { soru_kazanim: { kazanim_id: string }[] }
type IcerikSatiri = Omit<Icerik, 'kazanim_idleri'> & { icerik_kazanim: { kazanim_id: string }[] }

export class SupabaseKaynak implements IcerikKaynagi {
  readonly ad = 'supabase' as const

  constructor(private readonly db: SupabaseClient) {}

  async katalog(): Promise<Katalog> {
    const [dersler, seviyeler, uniteler, kazanimlar] = await Promise.all([
      this.db.from('ders').select('id, kod, ad, sira').order('sira'),
      this.db.from('seviye').select('id, kod, ad, sira').order('sira'),
      this.db.from('unite').select('id, ders_id, seviye_id, no, ad').order('no'),
      this.db.from('kazanim').select('id, unite_id, kod, metin, sira').order('sira'),
    ])
    return {
      dersler: hataVarsa(dersler),
      seviyeler: hataVarsa(seviyeler),
      uniteler: hataVarsa(uniteler),
      kazanimlar: hataVarsa(kazanimlar),
    }
  }

  async uniteSorulari(_uniteId: string, kazanimIdleri: string[]): Promise<Soru[]> {
    if (kazanimIdleri.length === 0) return []
    const baglar = hataVarsa(
      await this.db.from('soru_kazanim').select('soru_id').in('kazanim_id', kazanimIdleri),
    ) as { soru_id: string }[]
    const idler = [...new Set(baglar.map((b) => b.soru_id))]
    if (idler.length === 0) return []
    const satirlar = hataVarsa(
      await this.db
        .from('soru')
        .select(
          'id, tur, govde, sekil_svg, secenekler, dogru_cevap, cozum_adimlari, zorluk, baglam_temelli, kaynak_notu, ornek, soru_kazanim(kazanim_id)',
        )
        .in('id', idler)
        .order('zorluk'),
    ) as SoruSatiri[]
    return satirlar.map(({ soru_kazanim, ...s }) => ({ ...s, kazanim_idleri: soru_kazanim.map((k) => k.kazanim_id) }))
  }

  async uniteIcerikleri(uniteId: string): Promise<Icerik[]> {
    const satirlar = hataVarsa(
      await this.db
        .from('icerik')
        .select('id, tur, baslik, aciklama, unite_id, hafta, sira, html_yolu, meb_baglanti, ornek, icerik_kazanim(kazanim_id)')
        .eq('unite_id', uniteId)
        .order('hafta')
        .order('sira'),
    ) as IcerikSatiri[]
    return satirlar.map(({ icerik_kazanim, ...i }) => ({ ...i, kazanim_idleri: icerik_kazanim.map((k) => k.kazanim_id) }))
  }

  async icerik(id: string): Promise<Icerik | null> {
    const satir = hataVarsa(
      await this.db
        .from('icerik')
        .select('id, tur, baslik, aciklama, unite_id, hafta, sira, html_yolu, meb_baglanti, ornek, icerik_kazanim(kazanim_id)')
        .eq('id', id)
        .maybeSingle(),
    ) as IcerikSatiri | null
    if (!satir) return null
    const { icerik_kazanim, ...i } = satir
    return { ...i, kazanim_idleri: icerik_kazanim.map((k) => k.kazanim_id) }
  }

  async kitHtml(icerik: Icerik): Promise<string> {
    const yol = icerik.html_yolu
    if (!yol) throw new Error('Bu içeriğin HTML dosyası yok.')
    if (yol.startsWith('/')) return statikDosyaGetir(yol)
    const { data, error } = await this.db.storage.from(KIT_KOVASI).download(yol)
    if (error || !data) throw new Error(error?.message ?? 'Kit indirilemedi.')
    return data.text()
  }
}
