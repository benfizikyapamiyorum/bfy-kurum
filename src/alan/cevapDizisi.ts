// Elle sonuç girişi: öğretmenin yazdığı "ABCD-EAB..." gibi cevap dizisini çözümler.
// Kurallar:
//  - A, B, C, D, E: çoktan seçmeli cevap. Y: doğru/yanlış sorusunda "yanlış" (D "doğru" olarak okunur).
//  - Boş bırakılan soru için "-", "_", "." veya "*" yazılır.
//  - Boşluklar yok sayılır, böylece "ABCDE ABCDE" gibi gruplanarak yazılabilir.
//  - Küçük harf kabul edilir (Türkçe dönüşümle).

import { trBuyuk } from './turkce'

export type CevapDizisiSonucu =
  | { tamam: true; cevaplar: (string | null)[] }
  | { tamam: false; hata: string }

const BOS_ISARETLERI = new Set(['-', '_', '.', '*'])
const GECERLI_HARFLER = new Set(['A', 'B', 'C', 'D', 'E', 'Y'])

export function cevapDizisiniCozumle(girdi: string, soruSayisi: number): CevapDizisiSonucu {
  const temiz = [...trBuyuk(girdi).replace(/\s+/g, '')]
  const cevaplar: (string | null)[] = []
  for (const [i, karakter] of temiz.entries()) {
    if (BOS_ISARETLERI.has(karakter)) cevaplar.push(null)
    else if (GECERLI_HARFLER.has(karakter)) cevaplar.push(karakter)
    else return { tamam: false, hata: `${i + 1}. karakter ("${karakter}") geçerli bir cevap değil.` }
  }
  if (cevaplar.length !== soruSayisi) {
    return {
      tamam: false,
      hata: `Testte ${soruSayisi} soru var, ${cevaplar.length} cevap yazıldı.`,
    }
  }
  return { tamam: true, cevaplar }
}
