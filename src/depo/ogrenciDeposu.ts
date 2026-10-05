// Öğrencinin online test çözümü. Cevaplar önce yerel kuyruğa yazılır, internet varsa hemen,
// yoksa bağlantı gelince sunucuya gider. Puanlama sunucuda yapılır.

import type { Secenek, SoruTuru, TestTuru, CozumAdimi } from '../alan/tipler'
import { hataCevir } from './kurumDeposu'
import { kuyrugaEkle, kuyrukIsleyicisiKaydet, senkronizeEt } from './senkronKuyrugu'
import { supabase } from './supabaseIstemci'

function db() {
  const d = supabase()
  if (!d) throw new Error('Sunucu bağlantısı tanımlı değil.')
  return d
}

function sonuc<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(hataCevir(r.error.message))
  return r.data as T
}

export interface OgrenciAtamasi {
  atama_id: string
  test_id: string
  baslik: string
  tur: TestTuru
  sure_dk: number | null
  baslangic: string
  bitis: string | null
  soru_sayisi: number
  cozumler_acik: boolean
  tamamlandi: string | null
  dogru: number | null
  yanlis: number | null
  bos: number | null
  net: number | null
}

export const ogrenciAtamalari = async (): Promise<OgrenciAtamasi[]> =>
  (sonuc(await db().rpc('ogrenci_atamalari')) as OgrenciAtamasi[]).map((a) => ({
    ...a,
    net: a.net === null ? null : Number(a.net),
  }))

export interface CozulecekSoru {
  soru_id: string
  sira: number
  tur: SoruTuru
  govde: string
  sekil_svg: string | null
  secenekler: Secenek[] | null
  verilen: string | null
}

export const ogrenciTestSorulari = async (atamaId: string): Promise<CozulecekSoru[]> =>
  sonuc(await db().rpc('ogrenci_test_sorulari', { p_atama: atamaId })) as CozulecekSoru[]

interface CevapIslemi {
  atama: string
  soru: string
  verilen: string | null
  sure: number | null
}

kuyrukIsleyicisiKaydet('ogrenci_cevap', async (veri) => {
  const c = veri as CevapIslemi
  const { error } = await db().rpc('ogrenci_cevap_kaydet', {
    p_atama: c.atama,
    p_soru: c.soru,
    p_verilen: c.verilen ?? '',
    p_sure_sn: c.sure,
  })
  if (!error) return
  // Kalıcı ret (test bitti, süre doldu, yetki yok, geçersiz veri): yeniden denemek işe yaramaz.
  // İşlem kuyruktan düşer; aksi halde arkasındaki tüm işlemleri sonsuza dek bekletirdi.
  if (error.code === '42501' || error.code === '22023') return
  throw new Error(hataCevir(error.message))
})

/** Cevabı kuyruğa ekler. Aynı soruya verilen yeni cevap kuyruktaki eskisinin yerine geçer. */
export function cevapKaydet(atamaId: string, soruId: string, verilen: string | null, sureSn: number | null) {
  return kuyrugaEkle('ogrenci_cevap', { atama: atamaId, soru: soruId, verilen, sure: sureSn } satisfies CevapIslemi, `cevap:${atamaId}:${soruId}`)
}

export interface BitisSonucu {
  dogru: number
  yanlis: number
  bos: number
  net: number
}

/** Bekleyen cevapları gönderir, ardından testi bitirir. */
export async function testiBitir(atamaId: string): Promise<BitisSonucu> {
  const s = await senkronizeEt()
  if (s.kalan > 0) {
    throw new Error('Bazı cevaplar henüz gönderilemedi. İnternet bağlantını kontrol edip yeniden dene.')
  }
  const r = sonuc(await db().rpc('ogrenci_testi_bitir', { p_atama: atamaId })) as BitisSonucu
  return { ...r, net: Number(r.net) }
}

export interface SonucAyrintisi extends Omit<CozulecekSoru, 'verilen'> {
  verilen: string | null
  dogru_mu: boolean | null
  dogru_cevap: string | null
  cozum_adimlari: CozumAdimi[] | null
}

export const sonucAyrintisi = async (atamaId: string): Promise<SonucAyrintisi[]> =>
  sonuc(await db().rpc('ogrenci_sonuc_ayrintisi', { p_atama: atamaId })) as SonucAyrintisi[]
