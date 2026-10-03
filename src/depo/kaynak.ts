// İçerik kaynağı arayüzü. Supabase bağlıysa SupabaseKaynak, değilse YerelKaynak kullanılır.

import type { Icerik, Katalog, Soru } from '../alan/tipler'

export interface IcerikKaynagi {
  readonly ad: 'yerel' | 'supabase'
  katalog(): Promise<Katalog>
  /** Ünitenin kazanımlarına bağlı sorular. */
  uniteSorulari(uniteId: string, kazanimIdleri: string[]): Promise<Soru[]>
  uniteIcerikleri(uniteId: string): Promise<Icerik[]>
  /** Tek içerik (doğrudan bağlantıyla açılan kit için). */
  icerik(id: string): Promise<Icerik | null>
  /** HTML kitin metni. */
  kitHtml(icerik: Icerik): Promise<string>
}

/** '/' ile başlayan yollar uygulamayla yayınlanan statik dosyalardır. */
export async function statikDosyaGetir(yol: string): Promise<string> {
  const yanit = await fetch(yol, { cache: 'no-cache' })
  if (!yanit.ok) throw new Error(`Dosya alınamadı (${yanit.status}).`)
  return yanit.text()
}
