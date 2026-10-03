// Test oluşturma kuralları.
//  1. Aynı test içinde aynı soru iki kez bulunamaz (veritabanında test_soru birincil anahtarı da bunu zorlar).
//  2. Otomatik oluşturma seçilen kazanımlar arasında sırayla dağıtır ve zorluğu dengeler.
//  3. Sınıf grubuna daha önce verilmiş sorular mümkünse kullanılmaz; havuz yetmezse en sona bırakılır.

import type { Soru } from './tipler'

export class TekrarEdenSoruHatasi extends Error {
  constructor(public readonly soruId: string) {
    super('Bu soru testte zaten var. Aynı soru bir testte iki kez kullanılamaz.')
    this.name = 'TekrarEdenSoruHatasi'
  }
}

/** Soruyu listenin sonuna ekler. Soru zaten varsa hata fırlatır. */
export function testeSoruEkle(soruIdleri: readonly string[], soruId: string): string[] {
  if (soruIdleri.includes(soruId)) throw new TekrarEdenSoruHatasi(soruId)
  return [...soruIdleri, soruId]
}

/** Listedeki tekrarları bulur (ör. içe aktarılan testi doğrulamak için). */
export function tekrarEdenler(soruIdleri: readonly string[]): string[] {
  const gorulen = new Set<string>()
  const tekrar = new Set<string>()
  for (const id of soruIdleri) {
    if (gorulen.has(id)) tekrar.add(id)
    gorulen.add(id)
  }
  return [...tekrar]
}

export type ZorlukBandi = 'kolay' | 'orta' | 'zor'

export const zorlukBandi = (zorluk: number): ZorlukBandi =>
  zorluk <= 2 ? 'kolay' : zorluk === 3 ? 'orta' : 'zor'

/** Dengeli dağılım: %30 kolay, %40 orta, %30 zor (en büyük kalan yöntemiyle yuvarlanır). */
export function zorlukHedefleri(adet: number): Record<ZorlukBandi, number> {
  const oranlar: [ZorlukBandi, number][] = [
    ['kolay', 0.3],
    ['orta', 0.4],
    ['zor', 0.3],
  ]
  const ham = oranlar.map(([b, o]) => ({ b, deger: adet * o }))
  const sonuc = { kolay: 0, orta: 0, zor: 0 } as Record<ZorlukBandi, number>
  let kalan = adet
  for (const { b, deger } of ham) {
    sonuc[b] = Math.floor(deger)
    kalan -= sonuc[b]
  }
  ham
    .sort((x, y) => (y.deger % 1) - (x.deger % 1))
    .slice(0, kalan)
    .forEach(({ b }) => sonuc[b]++)
  return sonuc
}

export interface OtomatikTestSecenekleri {
  havuz: readonly Soru[]
  kazanimIdleri: readonly string[]
  adet: number
  /** Bu sınıf grubuna daha önce verilmiş soruların kimlikleri. */
  dahaOnceVerilenler?: ReadonlySet<string>
  /** Aynı girdiyle aynı testi üretmek için (testlerde kullanılır). */
  rastgele?: () => number
}

export interface OtomatikTestSonucu {
  soruIdleri: string[]
  /** Havuz yetmediyse ya da daha önce verilmiş soru kullanıldıysa açıklama. */
  uyarilar: string[]
}

/** Tohumlu sözde rastgele sayı üreteci (mulberry32). */
export function tohumluRastgele(tohum: number): () => number {
  let t = tohum >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function karistir<T>(dizi: T[], rastgele: () => number): T[] {
  const a = [...dizi]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rastgele() * (i + 1))
    ;[a[i], a[j]] = [a[j] as T, a[i] as T]
  }
  return a
}

export function otomatikTestOlustur(s: OtomatikTestSecenekleri): OtomatikTestSonucu {
  const rastgele = s.rastgele ?? Math.random
  const verilen = s.dahaOnceVerilenler ?? new Set<string>()
  const kazanimlar = new Set(s.kazanimIdleri)
  const uyarilar: string[] = []

  // Tekrarsız aday havuzu: seçilen kazanımlardan en az birine bağlı sorular.
  const adaylar = new Map<string, Soru>()
  for (const soru of s.havuz) {
    if (soru.kazanim_idleri.some((k) => kazanimlar.has(k))) adaylar.set(soru.id, soru)
  }

  // Önce hiç verilmemiş sorular, sonra daha önce verilenler.
  const yeni = karistir([...adaylar.values()].filter((x) => !verilen.has(x.id)), rastgele)
  const eski = karistir([...adaylar.values()].filter((x) => verilen.has(x.id)), rastgele)

  const hedef = zorlukHedefleri(s.adet)
  const secilen: Soru[] = []
  const secilenIdler = new Set<string>()
  const kazanimSayaci = new Map<string, number>()

  const ekle = (soru: Soru) => {
    secilen.push(soru)
    secilenIdler.add(soru.id)
    for (const k of soru.kazanim_idleri) kazanimSayaci.set(k, (kazanimSayaci.get(k) ?? 0) + 1)
  }

  // Kazanımlara dengeli dağıtmak için en az kullanılmış kazanımı içeren soruyu öne al.
  const enIyi = (liste: Soru[], uygun: (x: Soru) => boolean): Soru | undefined => {
    let aday: Soru | undefined
    let enAz = Infinity
    for (const soru of liste) {
      if (secilenIdler.has(soru.id) || !uygun(soru)) continue
      const kullanim = Math.min(
        ...soru.kazanim_idleri.filter((k) => kazanimlar.has(k)).map((k) => kazanimSayaci.get(k) ?? 0),
      )
      if (kullanim < enAz) {
        enAz = kullanim
        aday = soru
      }
    }
    return aday
  }

  for (const liste of [yeni, eski]) {
    // 1. tur: zorluk hedeflerine uyarak.
    for (const bant of ['kolay', 'orta', 'zor'] as ZorlukBandi[]) {
      while (hedef[bant] > 0 && secilen.length < s.adet) {
        const aday = enIyi(liste, (x) => zorlukBandi(x.zorluk) === bant)
        if (!aday) break
        ekle(aday)
        hedef[bant]--
      }
    }
    // 2. tur: hedef bandında soru kalmadıysa diğer bantlardan tamamla.
    while (secilen.length < s.adet) {
      const aday = enIyi(liste, () => true)
      if (!aday) break
      ekle(aday)
    }
  }

  const eskiSayisi = secilen.filter((x) => verilen.has(x.id)).length
  if (eskiSayisi > 0) {
    uyarilar.push(`${eskiSayisi} soru bu sınıfa daha önce verilmişti; havuzda yeterli yeni soru yok.`)
  }
  if (secilen.length < s.adet) {
    uyarilar.push(`İstenen ${s.adet} soru yerine ${secilen.length} soru bulunabildi.`)
  }

  // Kolaydan zora sırala; aynı zorlukta seçim sırası korunur.
  const sirali = secilen
    .map((soru, i) => ({ soru, i }))
    .sort((a, b) => a.soru.zorluk - b.soru.zorluk || a.i - b.i)
    .map((x) => x.soru.id)

  return { soruIdleri: sirali, uyarilar }
}
