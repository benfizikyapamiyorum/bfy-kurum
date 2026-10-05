// Tarayıcı içi veritabanı (IndexedDB). Tahtaya indirilen içerik, içe aktarılan kitler ve senkron kuyruğu burada.

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Icerik, Katalog, Soru } from '../alan/tipler'

export interface IndirilenKit {
  icerikId: string
  html: string
  boyut: number
  indirilme: string
}

export interface YerelKit {
  icerik: Icerik
  html: string
  boyut: number
  eklenme: string
}

export interface KuyrukIslemi {
  /** Tekil kimlik: sunucuda upsert anahtarı olarak da kullanılır, iki kez gönderim çift kayıt üretmez. */
  id: string
  tur: string
  veri: unknown
  olusturma: string
  deneme: number
  sonHata?: string
}

interface Sema extends DBSchema {
  katalog: { key: string; value: Katalog }
  sorular: { key: string; value: Soru & { _unite?: string } ; indexes: { unite: string } }
  icerikler: { key: string; value: Icerik }
  kitler: { key: string; value: IndirilenKit }
  yerelKitler: { key: string; value: YerelKit }
  kuyruk: { key: string; value: KuyrukIslemi; indexes: { olusturma: string } }
  /** Hangi ünitenin soruları tahtaya indirildi. */
  indirilenUniteler: { key: string; value: { uniteId: string; soruSayisi: number; indirilme: string } }
}

export type YerelDb = IDBPDatabase<Sema>

let baglanti: Promise<YerelDb> | null = null

/**
 * Tarayıcı veritabanını açar. Tarayıcı IndexedDB'yi engellerse (gizli pencere, kısıtlı çerçeve)
 * aynı işlemleri bellekte yapan bir yedek kullanılır: uygulama çalışır, yalnızca indirilenler kalıcı olmaz.
 */
export function yerelDb(): Promise<YerelDb> {
  if (!baglanti) {
    try {
      baglanti = ac().catch(() => bellekDb())
    } catch {
      baglanti = Promise.resolve(bellekDb())
    }
  }
  return baglanti
}

function ac(): Promise<YerelDb> {
  return openDB<Sema>('kurs-sistemi', 1, {
    upgrade(db) {
      db.createObjectStore('katalog')
      const sorular = db.createObjectStore('sorular', { keyPath: 'id' })
      sorular.createIndex('unite', '_unite')
      db.createObjectStore('icerikler', { keyPath: 'id' })
      db.createObjectStore('kitler', { keyPath: 'icerikId' })
      db.createObjectStore('yerelKitler', { keyPath: 'icerik.id' })
      const kuyruk = db.createObjectStore('kuyruk', { keyPath: 'id' })
      kuyruk.createIndex('olusturma', 'olusturma')
      db.createObjectStore('indirilenUniteler', { keyPath: 'uniteId' })
    },
  })
}

// ---------------------------------------------------------------------------
// Bellek yedeği: uygulamanın kullandığı idb işlemlerinin küçük bir alt kümesi.
// ---------------------------------------------------------------------------

const ANAHTAR_YOLU: Record<string, string | null> = {
  katalog: null,
  sorular: 'id',
  icerikler: 'id',
  kitler: 'icerikId',
  yerelKitler: 'icerik.id',
  kuyruk: 'id',
  indirilenUniteler: 'uniteId',
}
const DIZIN_YOLU: Record<string, string> = { unite: '_unite', olusturma: 'olusturma' }

// structuredClone eski tarayıcılarda yok; saklanan değerler düz JSON nesneleridir.
const kopya = <T,>(v: T): T => (v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T))

const yolOku = (nesne: unknown, yol: string) =>
  yol.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), nesne)

function bellekDb(): YerelDb {
  const depolar = new Map<string, Map<string, unknown>>()
  const depo = (ad: string) => {
    if (!depolar.has(ad)) depolar.set(ad, new Map())
    return depolar.get(ad)!
  }
  const put = async (ad: string, deger: unknown, anahtar?: string) => {
    const yol = ANAHTAR_YOLU[ad]
    const k = anahtar ?? (yol ? String(yolOku(deger, yol)) : '')
    depo(ad).set(k, kopya(deger))
    return k
  }
  const db = {
    get: async (ad: string, k: string) => kopya(depo(ad).get(k)),
    getAll: async (ad: string) => [...depo(ad).values()].map((v) => kopya(v)),
    getAllFromIndex: async (ad: string, dizin: string, deger?: unknown) => {
      const yol = DIZIN_YOLU[dizin]!
      return [...depo(ad).values()]
        .filter((v) => deger === undefined || yolOku(v, yol) === deger)
        .sort((a, b) => String(yolOku(a, yol)).localeCompare(String(yolOku(b, yol))))
        .map((v) => kopya(v))
    },
    put,
    delete: async (ad: string, k: string) => {
      depo(ad).delete(k)
    },
    count: async (ad: string) => depo(ad).size,
    clear: async (ad: string) => {
      depo(ad).clear()
    },
    transaction: () => ({
      objectStore: (ad: string) => ({ put: (deger: unknown, anahtar?: string) => put(ad, deger, anahtar) }),
      done: Promise.resolve(),
    }),
  }
  return db as unknown as YerelDb
}

/** Testler için: bağlantıyı sıfırlar. */
export function yerelDbSifirla(): void {
  baglanti = null
}
