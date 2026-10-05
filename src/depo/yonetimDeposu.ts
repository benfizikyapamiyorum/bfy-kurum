// Süper admin işlemleri: kurumlar ve lisanslar, soru bankası, kit yükleme, toplu içe aktarım.
// Yetki RLS ve SECURITY DEFINER fonksiyonlarındaki superadmin_mi() denetimiyle sağlanır.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { IceAktarimDosyasi } from '../alan/iceAktarim'
import type { Icerik, IcerikTuru, Secenek, Soru, SoruTuru } from '../alan/tipler'
import { trKarsilastir } from '../alan/turkce'
import { hataCevir } from './kurumDeposu'
import { supabase } from './supabaseIstemci'

function db(): SupabaseClient {
  const d = supabase()
  if (!d) throw new Error('Sunucu bağlantısı tanımlı değil.')
  return d
}

function sonuc<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(yonetimHatasi(r.error.message))
  return r.data as T
}

function yonetimHatasi(m: string): string {
  if (/kurum_kod_key/.test(m)) return 'Bu kurum kodu başka bir kurumda kullanılıyor.'
  if (/kurum_kod_check/.test(m)) return 'Kurum kodu 3-12 karakter olmalı ve yalnızca İngilizce büyük harf ile rakam içermeli.'
  if (/lisans_bitis/.test(m)) return 'Lisans bitişi başlangıçtan önce olamaz.'
  if (/soru_dis_kimlik_key|icerik_dis_kimlik_key/.test(m)) return 'Bu dış kimlik başka bir kayıtta kullanılıyor.'
  if (/foreign key|violates.*test_soru/i.test(m)) return 'Bu soru bir testte kullanıldığı için silinemez. Yayından kaldırabilirsiniz.'
  return hataCevir(m)
}

// ---------------------------------------------------------------------------
// Kurumlar
// ---------------------------------------------------------------------------

export interface KurumOzeti {
  id: string
  ad: string
  kod: string | null
  lisans_baslangic: string
  lisans_bitis: string
  aktif: boolean
  demo: boolean
  ogretmen_limiti: number
  ogrenci_limiti: number
  ogretmen_sayisi: number
  ogrenci_sayisi: number
  yonetici: string | null
}

export const kurumOzetleri = async (): Promise<KurumOzeti[]> => sonuc(await db().rpc('kurum_ozetleri')) as KurumOzeti[]

export interface KurumBilgisi {
  ad: string
  kod: string
  lisans_baslangic: string
  lisans_bitis: string
  ogretmen_limiti: number
  ogrenci_limiti: number
}

export async function kurumEkle(k: KurumBilgisi): Promise<string> {
  const r = sonuc(
    await db()
      .from('kurum')
      .insert({ ...k, ad: k.ad.trim(), kod: k.kod.trim().toLocaleUpperCase('tr-TR') })
      .select('id')
      .single(),
  ) as { id: string }
  return r.id
}

export async function kurumGuncelle(
  id: string,
  d: Partial<KurumBilgisi & { aktif: boolean }>,
): Promise<void> {
  const v = { ...d, ...(d.kod !== undefined ? { kod: d.kod.trim().toLocaleUpperCase('tr-TR') } : {}) }
  sonuc(await db().from('kurum').update(v).eq('id', id))
}

/** Bugünden ya da mevcut bitişten (hangisi ileriyse) itibaren lisansı uzatır. */
export function uzatilmisBitis(bitis: string, ay: number, bugun = new Date()): string {
  const b = new Date(`${bitis}T00:00:00`)
  const temel = b > bugun ? b : new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate())
  const y = new Date(temel.getFullYear(), temel.getMonth() + ay, temel.getDate())
  const iki = (n: number) => String(n).padStart(2, '0')
  return `${y.getFullYear()}-${iki(y.getMonth() + 1)}-${iki(y.getDate())}`
}

// ---------------------------------------------------------------------------
// Soru bankası
// ---------------------------------------------------------------------------

export interface BankaSorusu extends Soru {
  yayinda: boolean
  dis_kimlik: string | null
}

const SORU_ALANLARI =
  'id, dis_kimlik, tur, govde, sekil_svg, secenekler, dogru_cevap, cozum_adimlari, zorluk, baglam_temelli, kaynak_notu, beceri, kavram_yanilgisi, puanlama_olcutu, ornek, yayinda, soru_kazanim(kazanim_id)'

type SoruSatiri = Omit<BankaSorusu, 'kazanim_idleri'> & { soru_kazanim: { kazanim_id: string }[] }

export async function bankaSorulari(): Promise<BankaSorusu[]> {
  const r = sonuc(await db().from('soru').select(SORU_ALANLARI).order('zorluk')) as SoruSatiri[]
  return r.map(({ soru_kazanim, ...s }) => ({ ...s, kazanim_idleri: soru_kazanim.map((k) => k.kazanim_id) }))
}

export async function bankaSorusu(id: string): Promise<BankaSorusu | null> {
  const r = sonuc(await db().from('soru').select(SORU_ALANLARI).eq('id', id).maybeSingle()) as SoruSatiri | null
  if (!r) return null
  const { soru_kazanim, ...s } = r
  return { ...s, kazanim_idleri: soru_kazanim.map((k) => k.kazanim_id) }
}

export interface SoruTaslagi {
  tur: SoruTuru
  govde: string
  sekil_svg: string | null
  secenekler: Secenek[] | null
  dogru_cevap: string
  cozum_adimlari: { metin: string }[]
  zorluk: number
  baglam_temelli: boolean
  kaynak_notu: string | null
  beceri: string | null
  kavram_yanilgisi: string | null
  puanlama_olcutu: string | null
  ornek: boolean
  yayinda: boolean
  kazanim_idleri: string[]
}

/** Soruyu ve kazanım etiketlerini kaydeder; yeni soruysa kimliğini döner. */
export async function soruKaydet(id: string | null, t: SoruTaslagi): Promise<string> {
  if (t.kazanim_idleri.length === 0) throw new Error('En az bir kazanım seçin.')
  const { kazanim_idleri, ...alanlar } = t
  const satir = id
    ? (sonuc(await db().from('soru').update(alanlar).eq('id', id).select('id').single()) as { id: string })
    : (sonuc(await db().from('soru').insert(alanlar).select('id').single()) as { id: string })
  sonuc(await db().from('soru_kazanim').delete().eq('soru_id', satir.id))
  sonuc(await db().from('soru_kazanim').insert(kazanim_idleri.map((k) => ({ soru_id: satir.id, kazanim_id: k }))))
  return satir.id
}

export const soruYayini = async (id: string, yayinda: boolean) => {
  sonuc(await db().from('soru').update({ yayinda }).eq('id', id))
}

export const soruSil = async (id: string) => {
  sonuc(await db().from('soru').delete().eq('id', id))
}

// ---------------------------------------------------------------------------
// İçerikler ve kit yükleme
// ---------------------------------------------------------------------------

export interface BankaIcerigi extends Icerik {
  yayinda: boolean
  dis_kimlik: string | null
}

export async function bankaIcerikleri(): Promise<BankaIcerigi[]> {
  const r = sonuc(
    await db()
      .from('icerik')
      .select('id, dis_kimlik, tur, baslik, aciklama, unite_id, hafta, sira, html_yolu, veri, meb_baglanti, ornek, yayinda, icerik_kazanim(kazanim_id)'),
  ) as (Omit<BankaIcerigi, 'kazanim_idleri'> & { icerik_kazanim: { kazanim_id: string }[] })[]
  return r
    .map(({ icerik_kazanim, ...i }) => ({ ...i, kazanim_idleri: icerik_kazanim.map((k) => k.kazanim_id) }))
    .sort((a, b) => (a.hafta ?? 99) - (b.hafta ?? 99) || a.sira - b.sira || trKarsilastir(a.baslik, b.baslik))
}

export interface KitBilgisi {
  tur: IcerikTuru
  baslik: string
  aciklama: string | null
  unite_id: string
  seviye_kodu: string
  hafta: number | null
  kazanim_idleri: string[]
  yayinda: boolean
}

/** Dosya adını depolama yoluna uygun hâle getirir (Türkçe harfler sadeleşir). */
export function guvenliDosyaAdi(ad: string): string {
  const harita: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', İ: 'i' }
  const sade = ad
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşüİ]/g, (h) => harita[h] ?? h)
    .replace(/\.html?$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${sade || 'kit'}.html`
}

export async function kitYukle(dosya: File, b: KitBilgisi): Promise<string> {
  if (!/\.html?$/i.test(dosya.name)) throw new Error('Yalnızca .html dosyası yüklenebilir.')
  if (dosya.size > 25 * 1024 * 1024) throw new Error('Dosya 25 MB’tan büyük olamaz.')
  const yol = `kitler/${b.seviye_kodu}/${Date.now()}-${guvenliDosyaAdi(dosya.name)}`
  const { error } = await db().storage.from('icerik').upload(yol, dosya, { contentType: 'text/html', upsert: false })
  if (error) throw new Error(yonetimHatasi(error.message))
  const r = sonuc(
    await db()
      .from('icerik')
      .insert({
        tur: b.tur,
        baslik: b.baslik.trim(),
        aciklama: b.aciklama?.trim() || null,
        unite_id: b.unite_id,
        hafta: b.hafta,
        html_yolu: yol,
        yayinda: b.yayinda,
      })
      .select('id')
      .single(),
  ) as { id: string }
  if (b.kazanim_idleri.length) {
    sonuc(await db().from('icerik_kazanim').insert(b.kazanim_idleri.map((k) => ({ icerik_id: r.id, kazanim_id: k }))))
  }
  return r.id
}

export const icerikYayini = async (id: string, yayinda: boolean) => {
  sonuc(await db().from('icerik').update({ yayinda }).eq('id', id))
}

export async function icerikSil(i: BankaIcerigi): Promise<void> {
  sonuc(await db().from('icerik').delete().eq('id', i.id))
  if (i.html_yolu && !i.html_yolu.startsWith('/')) await db().storage.from('icerik').remove([i.html_yolu])
}

// ---------------------------------------------------------------------------
// Toplu içe aktarım
// ---------------------------------------------------------------------------

export interface AktarimSonucu {
  uniteler: number
  kazanimlar: number
  sorular_yeni: number
  sorular_guncellenen: number
  icerikler: number
}

export const topluIceAktar = async (dosya: IceAktarimDosyasi): Promise<AktarimSonucu> =>
  sonuc(await db().rpc('toplu_ice_aktar', { p_veri: dosya })) as AktarimSonucu
