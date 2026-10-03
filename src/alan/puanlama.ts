// YKS usulü net hesabı ve cevap karşılaştırma.

import { trBuyuk } from './turkce'

export interface NetSonucu {
  dogru: number
  yanlis: number
  bos: number
  net: number
}

/** Varsayılan: 4 yanlış 1 doğruyu götürür. */
export const VARSAYILAN_YANLIS_DOGRU_ORANI = 4

/**
 * Net = doğru − yanlış / oran. Oran 0 ise yanlışlar doğruyu götürmez.
 * Sonuç 2 basamağa yuvarlanır (YKS'de olduğu gibi). Net eksiye düşebilir.
 */
export function netHesapla(dogru: number, yanlis: number, oran = VARSAYILAN_YANLIS_DOGRU_ORANI): number {
  if (!Number.isInteger(dogru) || !Number.isInteger(yanlis) || dogru < 0 || yanlis < 0) {
    throw new RangeError('Doğru ve yanlış sayıları sıfır ya da pozitif tam sayı olmalı.')
  }
  if (!Number.isFinite(oran) || oran < 0) {
    throw new RangeError('Yanlış/doğru oranı sıfır ya da pozitif olmalı.')
  }
  const net = oran === 0 ? dogru : dogru - yanlis / oran
  return Math.round((net + Number.EPSILON) * 100) / 100
}

/**
 * Cevapları anahtarla karşılaştırır. Boş cevap null ya da boş metindir.
 * Harf karşılaştırması Türkçe büyük harfle yapılır.
 */
export function puanla(
  cevaplar: readonly (string | null)[],
  anahtar: readonly string[],
  oran = VARSAYILAN_YANLIS_DOGRU_ORANI,
): NetSonucu {
  if (cevaplar.length !== anahtar.length) {
    throw new RangeError(`Cevap sayısı (${cevaplar.length}) soru sayısıyla (${anahtar.length}) aynı olmalı.`)
  }
  let dogru = 0
  let yanlis = 0
  let bos = 0
  cevaplar.forEach((c, i) => {
    const verilen = c === null ? '' : trBuyuk(c.trim())
    if (verilen === '') bos++
    else if (verilen === trBuyuk(anahtar[i] ?? '')) dogru++
    else yanlis++
  })
  return { dogru, yanlis, bos, net: netHesapla(dogru, yanlis, oran) }
}
