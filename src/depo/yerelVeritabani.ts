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

export function yerelDb(): Promise<YerelDb> {
  baglanti ??= openDB<Sema>('kurs-sistemi', 1, {
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
  return baglanti
}

/** Testler için: bağlantıyı sıfırlar. */
export function yerelDbSifirla(): void {
  baglanti = null
}
