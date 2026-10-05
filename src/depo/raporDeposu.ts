// Rapor sorguları. Yetki RLS ve kazanim_basarisi RPC'sinde denetlenir.

import type { TestTuru } from '../alan/tipler'
import { hataCevir } from './kurumDeposu'
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

export interface KazanimBasarisi {
  kazanim_id: string
  deneme: number
  dogru: number
  yanlis: number
  bos: number
  yuzde: number
  ogrenci_sayisi: number
  soru_sayisi: number
}

export const kazanimBasarisi = async (sinifId: string, ogrenciId?: string): Promise<KazanimBasarisi[]> =>
  (sonuc(await db().rpc('kazanim_basarisi', { p_sinif: sinifId, p_ogrenci: ogrenciId ?? null })) as KazanimBasarisi[]).map((k) => ({
    ...k,
    yuzde: Number(k.yuzde),
  }))

export interface SonucSatiri {
  atama_id: string
  ogrenci_id: string
  dogru: number
  yanlis: number
  bos: number
  net: number
  tamamlandi: string
  test_id: string
  test_baslik: string
  test_tur: TestTuru
  baslangic: string
}

/** Bir sınıfın tüm atamalarındaki sonuçlar (eskiden yeniye). */
export async function sinifSonuclari(sinifId: string): Promise<SonucSatiri[]> {
  const veri = sonuc(
    await db()
      .from('sonuc')
      .select('atama_id, ogrenci_id, dogru, yanlis, bos, net, tamamlandi, atama!inner(sinif_grubu_id, baslangic, test(id, baslik, tur))')
      .eq('atama.sinif_grubu_id', sinifId),
  ) as unknown as (Omit<SonucSatiri, 'test_id' | 'test_baslik' | 'test_tur' | 'baslangic'> & {
    atama: { baslangic: string; test: { id: string; baslik: string; tur: TestTuru } }
  })[]
  return veri
    .map(({ atama, ...s }) => ({
      ...s,
      net: Number(s.net),
      test_id: atama.test.id,
      test_baslik: atama.test.baslik,
      test_tur: atama.test.tur,
      baslangic: atama.baslangic,
    }))
    .sort((a, b) => a.baslangic.localeCompare(b.baslangic))
}

/** Öğrencinin kendi sonuçları (öğrenci ekranı). */
export async function kendiSonuclarim(ogrenciId: string): Promise<SonucSatiri[]> {
  const veri = sonuc(
    await db()
      .from('sonuc')
      .select('atama_id, ogrenci_id, dogru, yanlis, bos, net, tamamlandi, atama!inner(baslangic, test(id, baslik, tur))')
      .eq('ogrenci_id', ogrenciId),
  ) as unknown as (Omit<SonucSatiri, 'test_id' | 'test_baslik' | 'test_tur' | 'baslangic'> & {
    atama: { baslangic: string; test: { id: string; baslik: string; tur: TestTuru } | null }
  })[]
  return veri
    .filter((s) => s.atama.test)
    .map(({ atama, ...s }) => ({
      ...s,
      net: Number(s.net),
      test_id: atama.test!.id,
      test_baslik: atama.test!.baslik,
      test_tur: atama.test!.tur,
      baslangic: atama.baslangic,
    }))
    .sort((a, b) => a.tamamlandi.localeCompare(b.tamamlandi))
}
