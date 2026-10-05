// Rapor hesapları (saf fonksiyonlar, testli).

export interface KazanimDurumu {
  kazanim_id: string
  deneme: number
  yuzde: number
}

export const ZAYIF_ESIK = 50
export const EN_AZ_DENEME = 3

/** Zayıf kazanımlar: başarı eşikten düşük ve yeterli denemesi olanlar, en zayıftan başlayarak. */
export function zayifKazanimlar<T extends KazanimDurumu>(liste: readonly T[], esik = ZAYIF_ESIK, enAzDeneme = EN_AZ_DENEME): T[] {
  return liste.filter((k) => k.deneme >= enAzDeneme && k.yuzde < esik).sort((a, b) => a.yuzde - b.yuzde)
}

/** Basit doğrusal eğilim: son değerlerin ilk değerlere göre değişimi (en az 2 nokta). */
export function egilim(degerler: readonly number[]): 'artiyor' | 'azaliyor' | 'sabit' | null {
  if (degerler.length < 2) return null
  const n = degerler.length
  const ortX = (n - 1) / 2
  const ortY = degerler.reduce((t, y) => t + y, 0) / n
  let pay = 0
  let payda = 0
  degerler.forEach((y, x) => {
    pay += (x - ortX) * (y - ortY)
    payda += (x - ortX) ** 2
  })
  const egim = pay / payda
  if (Math.abs(egim) < 0.25) return 'sabit'
  return egim > 0 ? 'artiyor' : 'azaliyor'
}

export interface OgrenciOzeti {
  ogrenci_id: string
  sinav: number
  ortalama: number
  son: number
  netler: number[]
}

/** Sonuç satırlarından öğrenci bazında özet. */
export function ogrenciOzetleri(sonuclar: readonly { ogrenci_id: string; net: number }[]): Map<string, OgrenciOzeti> {
  const m = new Map<string, OgrenciOzeti>()
  for (const s of sonuclar) {
    const o = m.get(s.ogrenci_id) ?? { ogrenci_id: s.ogrenci_id, sinav: 0, ortalama: 0, son: 0, netler: [] }
    o.netler.push(s.net)
    o.sinav = o.netler.length
    o.son = s.net
    o.ortalama = Math.round((o.netler.reduce((t, x) => t + x, 0) / o.netler.length) * 100) / 100
    m.set(s.ogrenci_id, o)
  }
  return m
}
