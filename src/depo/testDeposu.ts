// Test, atama ve sonuç işlemleri (öğretmen tarafı). Yetki RLS ve RPC'lerde denetlenir.

import type { Atama, Soru, Sonuc, Test, TestAyarlari, TestTuru } from '../alan/tipler'
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

const SORU_ALANLARI =
  'id, tur, govde, sekil_svg, secenekler, dogru_cevap, cozum_adimlari, zorluk, baglam_temelli, kaynak_notu, ornek, beceri, kavram_yanilgisi, puanlama_olcutu, soru_kazanim(kazanim_id)'

type SoruSatiri = Omit<Soru, 'kazanim_idleri'> & { soru_kazanim: { kazanim_id: string }[] }
const soruDonustur = ({ soru_kazanim, ...s }: SoruSatiri): Soru => ({
  ...s,
  kazanim_idleri: soru_kazanim.map((k) => k.kazanim_id),
})

/** Verilen kazanımlara bağlı yayındaki sorular. */
export async function kazanimSorulari(kazanimIdleri: string[]): Promise<Soru[]> {
  if (kazanimIdleri.length === 0) return []
  const baglar = sonuc(await db().from('soru_kazanim').select('soru_id').in('kazanim_id', kazanimIdleri)) as {
    soru_id: string
  }[]
  const idler = [...new Set(baglar.map((b) => b.soru_id))]
  const sorular: Soru[] = []
  for (let i = 0; i < idler.length; i += 150) {
    const parca = sonuc(await db().from('soru').select(SORU_ALANLARI).in('id', idler.slice(i, i + 150))) as SoruSatiri[]
    sorular.push(...parca.map(soruDonustur))
  }
  return sorular
}

export interface TestOzeti extends Test {
  soru_sayisi: number
  atama_sayisi: number
}

export async function testler(kurumId: string): Promise<TestOzeti[]> {
  const veri = sonuc(
    await db()
      .from('test')
      .select('*, test_soru(count), atama(count)')
      .eq('kurum_id', kurumId)
      .order('olusturma', { ascending: false }),
  ) as (Test & { test_soru: { count: number }[]; atama: { count: number }[] })[]
  return veri.map(({ test_soru, atama, ...t }) => ({
    ...t,
    soru_sayisi: test_soru[0]?.count ?? 0,
    atama_sayisi: atama[0]?.count ?? 0,
  }))
}

export interface TestAyrintisi {
  test: Test
  sorular: Soru[]
}

export async function testGetir(id: string): Promise<TestAyrintisi> {
  const t = sonuc(await db().from('test').select('*').eq('id', id).single()) as Test
  const satirlar = sonuc(
    await db().from('test_soru').select(`sira, soru(${SORU_ALANLARI})`).eq('test_id', id).order('sira'),
  ) as unknown as { sira: number; soru: SoruSatiri }[]
  return { test: t, sorular: satirlar.map((s) => soruDonustur(s.soru)) }
}

export interface TestTaslagi {
  id?: string
  baslik: string
  tur: TestTuru
  aciklama: string | null
  sure_dk: number | null
  yanlis_dogru_orani: number
  ayarlar: TestAyarlari
}

export async function testKaydet(kurumId: string, olusturanId: string, t: TestTaslagi, soruIdleri: string[]): Promise<string> {
  const alanlar = {
    baslik: t.baslik.trim(),
    tur: t.tur,
    aciklama: t.aciklama?.trim() || null,
    sure_dk: t.sure_dk,
    yanlis_dogru_orani: t.yanlis_dogru_orani,
    ayarlar: t.ayarlar,
  }
  let id = t.id
  if (id) {
    sonuc(await db().from('test').update(alanlar).eq('id', id))
  } else {
    id = (sonuc(
      await db().from('test').insert({ ...alanlar, kurum_id: kurumId, olusturan_id: olusturanId }).select('id').single(),
    ) as { id: string }).id
  }
  sonuc(await db().rpc('test_sorulari_kaydet', { p_test: id, p_sorular: soruIdleri }))
  return id
}

export async function testSil(id: string): Promise<void> {
  sonuc(await db().from('test').delete().eq('id', id))
}

/** Sınıf grubuna daha önce atanmış testlerdeki soruların kimlikleri. */
export async function sinifaVerilmisSorular(sinifGrubuId: string, haricTestId?: string): Promise<Set<string>> {
  const atamalar = sonuc(await db().from('atama').select('test_id').eq('sinif_grubu_id', sinifGrubuId)) as {
    test_id: string
  }[]
  const testIdleri = [...new Set(atamalar.map((a) => a.test_id))].filter((x) => x !== haricTestId)
  if (testIdleri.length === 0) return new Set()
  const ts = sonuc(await db().from('test_soru').select('soru_id').in('test_id', testIdleri)) as { soru_id: string }[]
  return new Set(ts.map((x) => x.soru_id))
}

// ---------------------------------------------------------------------------
// Atama
// ---------------------------------------------------------------------------

export interface AtamaOzeti extends Atama {
  sinif_adi: string
  tamamlayan: number
}

export async function testAtamalari(testId: string): Promise<AtamaOzeti[]> {
  const veri = sonuc(
    await db()
      .from('atama')
      .select('*, sinif_grubu(ad), sonuc(count)')
      .eq('test_id', testId)
      .order('baslangic', { ascending: false }),
  ) as (Atama & { sinif_grubu: { ad: string } | null; sonuc: { count: number }[] })[]
  return veri.map(({ sinif_grubu, sonuc: s, ...a }) => ({
    ...a,
    sinif_adi: sinif_grubu?.ad ?? '',
    tamamlayan: s[0]?.count ?? 0,
  }))
}

export async function atamaOlustur(
  kurumId: string,
  olusturanId: string,
  testId: string,
  grupIdleri: string[],
  baslangic: Date,
  bitis: Date | null,
): Promise<void> {
  sonuc(
    await db()
      .from('atama')
      .insert(
        grupIdleri.map((g) => ({
          kurum_id: kurumId,
          test_id: testId,
          sinif_grubu_id: g,
          baslangic: baslangic.toISOString(),
          bitis: bitis?.toISOString() ?? null,
          olusturan_id: olusturanId,
        })),
      ),
  )
}

export async function atamaGuncelle(id: string, d: Partial<Pick<Atama, 'cozumler_acik' | 'bitis'>>): Promise<void> {
  sonuc(await db().from('atama').update(d).eq('id', id))
}

export async function atamaSil(id: string): Promise<void> {
  sonuc(await db().from('atama').delete().eq('id', id))
}

export interface AtamaSonuclari {
  atama: Atama & { sinif_adi: string }
  ogrenciler: { id: string; ad_soyad: string; kullanici_adi: string | null }[]
  sonuclar: Map<string, Sonuc>
  /** ogrenci_id → soru_id → verilen cevap ve doğruluk */
  cevaplar: Map<string, Map<string, { verilen: string | null; dogru_mu: boolean | null }>>
}

export async function atamaSonuclari(atamaId: string): Promise<AtamaSonuclari> {
  const a = sonuc(await db().from('atama').select('*, sinif_grubu(ad)').eq('id', atamaId).single()) as Atama & {
    sinif_grubu: { ad: string } | null
  }
  const [uyeler, sonuclar, cevaplar] = await Promise.all([
    db().from('sinif_grubu_ogrenci').select('kullanici(id, ad_soyad, kullanici_adi)').eq('sinif_grubu_id', a.sinif_grubu_id),
    db().from('sonuc').select('*').eq('atama_id', atamaId),
    db().from('cevap').select('ogrenci_id, soru_id, verilen, dogru_mu').eq('atama_id', atamaId),
  ])
  const ogrenciler = (sonuc(uyeler) as unknown as { kullanici: { id: string; ad_soyad: string; kullanici_adi: string | null } }[])
    .map((u) => u.kullanici)
    .sort((x, y) => x.ad_soyad.localeCompare(y.ad_soyad, 'tr'))
  const cevapMap = new Map<string, Map<string, { verilen: string | null; dogru_mu: boolean | null }>>()
  for (const c of sonuc(cevaplar) as { ogrenci_id: string; soru_id: string; verilen: string | null; dogru_mu: boolean | null }[]) {
    if (!cevapMap.has(c.ogrenci_id)) cevapMap.set(c.ogrenci_id, new Map())
    cevapMap.get(c.ogrenci_id)!.set(c.soru_id, { verilen: c.verilen, dogru_mu: c.dogru_mu })
  }
  const { sinif_grubu, ...atama } = a
  return {
    atama: { ...atama, sinif_adi: sinif_grubu?.ad ?? '' },
    ogrenciler,
    sonuclar: new Map((sonuc(sonuclar) as Sonuc[]).map((s) => [s.ogrenci_id, { ...s, net: Number(s.net) }])),
    cevaplar: cevapMap,
  }
}

export async function elleSonucKaydet(atamaId: string, ogrenciId: string, cevaplar: (string | null)[]): Promise<Sonuc> {
  const r = sonuc(
    await db().rpc('elle_sonuc_kaydet', { p_atama: atamaId, p_ogrenci: ogrenciId, p_cevaplar: cevaplar.map((c) => c ?? '') }),
  ) as Sonuc
  return { ...r, net: Number(r.net) }
}
