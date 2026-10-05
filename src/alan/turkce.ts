// Türkçe sıralama ve büyük/küçük harf dönüşümleri.
// JavaScript'in varsayılan toUpperCase() fonksiyonu "i" harfini "I" yapar; Türkçede "İ" olmalı.

const karsilastirici = new Intl.Collator('tr', { sensitivity: 'base', numeric: true })

/** Türkçe alfabe sırasıyla karşılaştırır (ç, ğ, ı, ö, ş, ü doğru yerde; "9-A" < "10-A"). */
export const trKarsilastir = (a: string, b: string): number => karsilastirici.compare(a, b)

export const trSirala = <T>(dizi: readonly T[], anahtar: (x: T) => string): T[] =>
  [...dizi].sort((a, b) => trKarsilastir(anahtar(a), anahtar(b)))

export const trBuyuk = (s: string): string => s.toLocaleUpperCase('tr-TR')
export const trKucuk = (s: string): string => s.toLocaleLowerCase('tr-TR')

/** Arama için normalleştirir: Türkçe küçük harf, fazla boşluk yok. */
export const trAramaAnahtari = (s: string): string => trKucuk(s).replace(/\s+/g, ' ').trim()

/** Türkçe sayı biçimi: ondalık virgül (2,5). */
export const trSayi = (n: number, basamak = 2): string =>
  n.toLocaleString('tr-TR', { maximumFractionDigits: basamak })

/**
 * Kurum ve sınıf kodları yalnızca İngilizce büyük harf ve rakamdır. Türkçe klavyede küçük
 * yazılan "i" Türkçe kurala göre "İ" olurdu; burada i, ı, İ hepsi "I" sayılır.
 */
export const girisKodu = (s: string): string =>
  s
    .trim()
    .replace(/[iıİ]/g, 'I')
    .toUpperCase()
