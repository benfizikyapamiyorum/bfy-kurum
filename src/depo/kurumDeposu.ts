// Kurum paneli veri işlemleri. Yetki RLS ve "kullanici" Edge Function'ı tarafından denetlenir.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Kullanici, Rol, SinifGrubu } from '../alan/tipler'
import { trKarsilastir } from '../alan/turkce'
import { supabase } from './supabaseIstemci'

const LOGO_KOVASI = 'logolar'

function db(): SupabaseClient {
  const d = supabase()
  if (!d) throw new Error('Sunucu bağlantısı tanımlı değil.')
  return d
}

function sonuc<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(hataCevir(r.error.message))
  return r.data as T
}

/** Veritabanı mesajlarını anlaşılır hâle getirir. */
export function hataCevir(m: string): string {
  if (/sinif_grubu_kurum_id_ad_key/.test(m)) return 'Bu adda bir sınıf zaten var.'
  if (/row-level security/i.test(m)) return 'Bu işlem için yetkiniz yok ya da kurum lisansı geçerli değil.'
  if (/fetch|network/i.test(m)) return 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.'
  return m
}

export interface KurumKullanicisi extends Kullanici {
  sinif_idleri: string[]
}

export async function kurumKullanicilari(kurumId: string): Promise<KurumKullanicisi[]> {
  const [kullanicilar, uyelikler] = await Promise.all([
    db().from('kullanici').select('id, kurum_id, rol, ad_soyad, kullanici_adi, eposta, aktif').eq('kurum_id', kurumId),
    db().from('sinif_grubu_ogrenci').select('sinif_grubu_id, ogrenci_id, sinif_grubu!inner(kurum_id)').eq('sinif_grubu.kurum_id', kurumId),
  ])
  const uye = new Map<string, string[]>()
  for (const u of sonuc(uyelikler) as { sinif_grubu_id: string; ogrenci_id: string }[]) {
    uye.set(u.ogrenci_id, [...(uye.get(u.ogrenci_id) ?? []), u.sinif_grubu_id])
  }
  return (sonuc(kullanicilar) as Kullanici[])
    .map((k) => ({ ...k, sinif_idleri: uye.get(k.id) ?? [] }))
    .sort((a, b) => trKarsilastir(a.ad_soyad, b.ad_soyad))
}

export async function siniflar(kurumId: string): Promise<SinifGrubu[]> {
  const veri = sonuc(
    await db()
      .from('sinif_grubu')
      .select('id, kurum_id, ad, seviye_id, katilim_kodu, arsiv')
      .eq('kurum_id', kurumId)
      .eq('arsiv', false),
  ) as SinifGrubu[]
  return veri.sort((a, b) => trKarsilastir(a.ad, b.ad))
}

export async function sinifEkle(kurumId: string, ad: string, seviyeId: string | null): Promise<SinifGrubu> {
  const kod = sonuc(await db().rpc('katilim_kodu_uret')) as string
  return sonuc(
    await db()
      .from('sinif_grubu')
      .insert({ kurum_id: kurumId, ad: ad.trim(), seviye_id: seviyeId, katilim_kodu: kod })
      .select('id, kurum_id, ad, seviye_id, katilim_kodu, arsiv')
      .single(),
  ) as SinifGrubu
}

export async function sinifGuncelle(id: string, d: Partial<Pick<SinifGrubu, 'ad' | 'seviye_id' | 'arsiv'>>): Promise<void> {
  sonuc(await db().from('sinif_grubu').update(d).eq('id', id))
}

export async function sinifKodunuYenile(id: string): Promise<string> {
  const kod = sonuc(await db().rpc('katilim_kodu_uret')) as string
  sonuc(await db().from('sinif_grubu').update({ katilim_kodu: kod }).eq('id', id))
  return kod
}

export async function sinifaEkle(sinifId: string, ogrenciIdleri: string[]): Promise<void> {
  if (ogrenciIdleri.length === 0) return
  sonuc(
    await db()
      .from('sinif_grubu_ogrenci')
      .upsert(
        ogrenciIdleri.map((o) => ({ sinif_grubu_id: sinifId, ogrenci_id: o })),
        { ignoreDuplicates: true },
      ),
  )
}

export async function siniftanCikar(sinifId: string, ogrenciId: string): Promise<void> {
  sonuc(await db().from('sinif_grubu_ogrenci').delete().eq('sinif_grubu_id', sinifId).eq('ogrenci_id', ogrenciId))
}

export async function kurumAdiGuncelle(kurumId: string, ad: string): Promise<void> {
  sonuc(await db().from('kurum').update({ ad: ad.trim() }).eq('id', kurumId))
}

// ---------------------------------------------------------------------------
// Logo
// ---------------------------------------------------------------------------

export const logoAdresi = (yol: string | null | undefined): string | null =>
  yol ? db().storage.from(LOGO_KOVASI).getPublicUrl(yol).data.publicUrl : null

export async function logoYukle(kurumId: string, dosya: File): Promise<string> {
  // SVG betik taşıyabildiği için herkese açık kovaya yüklenmez.
  if (!/^image\/(png|jpeg|webp)$/.test(dosya.type)) throw new Error('Yalnızca PNG, JPEG ya da WebP yükleyin.')
  if (dosya.size > 1024 * 1024) throw new Error('Logo 1 MB’tan küçük olmalı.')
  const uzanti = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[dosya.type]
  // Her yüklemede yeni ad: tarayıcı önbelleği eski logoyu göstermesin.
  const yol = `${kurumId}/logo-${Date.now()}.${uzanti}`
  const { error } = await db().storage.from(LOGO_KOVASI).upload(yol, dosya, { contentType: dosya.type, upsert: false })
  if (error) throw new Error(hataCevir(error.message))
  sonuc(await db().from('kurum').update({ logo_yolu: yol }).eq('id', kurumId))
  return yol
}

export async function logoKaldir(kurumId: string): Promise<void> {
  sonuc(await db().from('kurum').update({ logo_yolu: null }).eq('id', kurumId))
}

// ---------------------------------------------------------------------------
// Hesap işlemleri (Edge Function)
// ---------------------------------------------------------------------------

export interface YeniKullanici {
  rol: Rol
  ad_soyad: string
  kullanici_adi?: string | null
  eposta?: string | null
  sifre?: string | null
}

export interface HesapSonucu {
  tamam: boolean
  id?: string
  ad_soyad: string
  rol: Rol
  kullanici_adi: string | null
  eposta: string | null
  sifre?: string
  hata?: string
}

async function islev<T>(govde: Record<string, unknown>): Promise<T> {
  const { data, error } = await db().functions.invoke('kullanici', { body: govde })
  if (error) {
    // Edge Function hata gövdesindeki Türkçe mesajı göster.
    const ctx = (error as { context?: Response }).context
    let mesaj = error.message
    try {
      const j = ctx ? await ctx.json() : null
      if (j?.hata) mesaj = j.hata
    } catch {
      // gövde JSON değil
    }
    throw new Error(hataCevir(mesaj))
  }
  if (data?.hata) throw new Error(data.hata)
  return data as T
}

export async function hesapAc(kurumId: string | null, kullanicilar: YeniKullanici[]): Promise<HesapSonucu[]> {
  const sonuclar: HesapSonucu[] = []
  // Uzun listeler parça parça gönderilir.
  for (let i = 0; i < kullanicilar.length; i += 100) {
    const r = await islev<{ sonuclar: HesapSonucu[] }>({
      islem: 'olustur',
      kurum_id: kurumId,
      kullanicilar: kullanicilar.slice(i, i + 100),
    })
    sonuclar.push(...r.sonuclar)
  }
  return sonuclar
}

export const sifreSifirla = (kullaniciId: string, sifre?: string) =>
  islev<{ sifre: string }>({ islem: 'sifre_sifirla', kullanici_id: kullaniciId, sifre })

export const hesapDurumu = (kullaniciId: string, aktif: boolean) =>
  islev<{ tamam: true }>({ islem: 'durum', kullanici_id: kullaniciId, aktif })

export const hesapSil = (kullaniciId: string) => islev<{ tamam: true }>({ islem: 'sil', kullanici_id: kullaniciId })
