// Uygulamanın tek veri giriş noktası. Sırası:
//  1. Bu tarayıcıya içe aktarılmış kitler (yerel:) her zaman IndexedDB'den gelir.
//  2. Tahtaya indirilmiş kitler önce IndexedDB'den okunur (internet olmasa da açılır).
//  3. Diğer her şey önce kaynaktan (Supabase ya da yerel örnek veri) istenir; başarılı yanıt
//     IndexedDB'ye yazılır. Kaynak yanıt vermezse (internet yok) son kopya kullanılır.

import type { Icerik, Katalog, Soru } from '../alan/tipler'
import { trKarsilastir } from '../alan/turkce'
import type { IcerikKaynagi } from './kaynak'
import { SupabaseKaynak } from './supabaseKaynak'
import { supabase } from './supabaseIstemci'
import { YerelKaynak } from './yerelKaynak'
import { yerelDb, type IndirilenKit, type YerelKit } from './yerelVeritabani'

export const YEREL_KIT_ON_EKI = 'yerel:'

export class CevrimdisiHatasi extends Error {
  constructor(mesaj = 'Bu içerik çevrimdışı kullanılamıyor. İnternet varken "Tahtaya indir" ekranından indirin.') {
    super(mesaj)
    this.name = 'CevrimdisiHatasi'
  }
}

let kaynakOrnegi: IcerikKaynagi | null = null
export function kaynak(): IcerikKaynagi {
  if (!kaynakOrnegi) {
    const db = supabase()
    kaynakOrnegi = db ? new SupabaseKaynak(db) : new YerelKaynak()
  }
  return kaynakOrnegi
}

/** Testler için kaynağı değiştirir. */
export function kaynakAyarla(k: IcerikKaynagi | null): void {
  kaynakOrnegi = k
}

export async function katalogGetir(): Promise<Katalog> {
  const db = await yerelDb()
  try {
    const k = await kaynak().katalog()
    await db.put('katalog', k, 'son')
    return k
  } catch (e) {
    const yedek = await db.get('katalog', 'son')
    if (yedek) return yedek
    throw e instanceof Error ? e : new CevrimdisiHatasi()
  }
}

export interface UniteIcerigi {
  icerikler: Icerik[]
  sorular: Soru[]
  /** true ise veriler ağdan değil, tahtaya indirilmiş kopyadan geldi. */
  cevrimdisiKopya: boolean
}

export async function uniteIcerigiGetir(uniteId: string, kazanimIdleri: string[]): Promise<UniteIcerigi> {
  const db = await yerelDb()
  const yerelKitler = (await db.getAll('yerelKitler'))
    .map((k) => k.icerik)
    .filter((i) => i.unite_id === uniteId)

  let icerikler: Icerik[]
  let sorular: Soru[]
  let cevrimdisiKopya = false
  try {
    ;[icerikler, sorular] = await Promise.all([
      kaynak().uniteIcerikleri(uniteId),
      kaynak().uniteSorulari(uniteId, kazanimIdleri),
    ])
    const tx = db.transaction(['icerikler', 'sorular'], 'readwrite')
    await Promise.all([
      ...icerikler.map((i) => tx.objectStore('icerikler').put(i)),
      ...sorular.map((s) => tx.objectStore('sorular').put({ ...s, _unite: uniteId })),
      tx.done,
    ])
  } catch {
    cevrimdisiKopya = true
    icerikler = (await db.getAll('icerikler')).filter((i) => i.unite_id === uniteId)
    sorular = await db.getAllFromIndex('sorular', 'unite', uniteId)
    if (icerikler.length === 0 && sorular.length === 0 && yerelKitler.length === 0) throw new CevrimdisiHatasi()
  }

  const tum = [...icerikler, ...yerelKitler].sort(
    (a, b) => (a.hafta ?? 99) - (b.hafta ?? 99) || a.sira - b.sira || trKarsilastir(a.baslik, b.baslik),
  )
  return { icerikler: tum, sorular: sorular.map(({ _unite, ...s }: Soru & { _unite?: string }) => s), cevrimdisiKopya }
}

export async function icerikGetir(id: string): Promise<Icerik | null> {
  const db = await yerelDb()
  if (id.startsWith(YEREL_KIT_ON_EKI)) return (await db.get('yerelKitler', id))?.icerik ?? null
  const kayitli = await db.get('icerikler', id)
  if (kayitli) return kayitli
  try {
    const i = await kaynak().icerik(id)
    if (i) await db.put('icerikler', i)
    return i
  } catch {
    throw new CevrimdisiHatasi()
  }
}

export async function soruGetir(id: string): Promise<Soru | null> {
  const db = await yerelDb()
  const s = await db.get('sorular', id)
  if (!s) return null
  const { _unite, ...soru } = s as Soru & { _unite?: string }
  return soru
}

/** Kitin HTML metni. İndirilmişse internet olmadan da gelir. */
export async function kitHtmlGetir(icerik: Icerik): Promise<string> {
  const db = await yerelDb()
  if (icerik.id.startsWith(YEREL_KIT_ON_EKI)) {
    const k = await db.get('yerelKitler', icerik.id)
    if (!k) throw new Error('İçe aktarılan kit bu tarayıcıda bulunamadı.')
    return k.html
  }
  const indirilen = await db.get('kitler', icerik.id)
  if (indirilen) return indirilen.html
  try {
    return await kaynak().kitHtml(icerik)
  } catch {
    throw new CevrimdisiHatasi()
  }
}

// ---------------------------------------------------------------------------
// Tahtaya indirme
// ---------------------------------------------------------------------------

export async function kitIndir(icerik: Icerik): Promise<IndirilenKit> {
  const html = await kaynak().kitHtml(icerik)
  const kayit: IndirilenKit = {
    icerikId: icerik.id,
    html,
    boyut: new Blob([html]).size,
    indirilme: new Date().toISOString(),
  }
  const db = await yerelDb()
  await db.put('icerikler', icerik)
  await db.put('kitler', kayit)
  return kayit
}

export async function uniteSorulariniIndir(uniteId: string, kazanimIdleri: string[]): Promise<number> {
  const sorular = await kaynak().uniteSorulari(uniteId, kazanimIdleri)
  const db = await yerelDb()
  const tx = db.transaction(['sorular', 'indirilenUniteler'], 'readwrite')
  await Promise.all([
    ...sorular.map((s) => tx.objectStore('sorular').put({ ...s, _unite: uniteId })),
    tx.objectStore('indirilenUniteler').put({
      uniteId,
      soruSayisi: sorular.length,
      indirilme: new Date().toISOString(),
    }),
    tx.done,
  ])
  return sorular.length
}

export async function indirilenler() {
  const db = await yerelDb()
  const [kitler, uniteler] = await Promise.all([db.getAll('kitler'), db.getAll('indirilenUniteler')])
  return {
    kitler: new Map(kitler.map((k) => [k.icerikId, k])),
    uniteler: new Map(uniteler.map((u) => [u.uniteId, u])),
  }
}

export async function kitIndirmesiniKaldir(icerikId: string): Promise<void> {
  await (await yerelDb()).delete('kitler', icerikId)
}

export async function uniteIndirmesiniKaldir(uniteId: string): Promise<void> {
  const db = await yerelDb()
  await db.delete('indirilenUniteler', uniteId)
}

// ---------------------------------------------------------------------------
// HTML kit içe aktarma (bu tarayıcıya)
// ---------------------------------------------------------------------------

export async function yerelKitEkle(icerik: Omit<Icerik, 'id'>, html: string): Promise<YerelKit> {
  const kit: YerelKit = {
    icerik: { ...icerik, id: `${YEREL_KIT_ON_EKI}${crypto.randomUUID()}` },
    html,
    boyut: new Blob([html]).size,
    eklenme: new Date().toISOString(),
  }
  await (await yerelDb()).put('yerelKitler', kit)
  return kit
}

export async function yerelKitler(): Promise<YerelKit[]> {
  return (await yerelDb()).getAll('yerelKitler')
}

export async function yerelKitSil(id: string): Promise<void> {
  await (await yerelDb()).delete('yerelKitler', id)
}
