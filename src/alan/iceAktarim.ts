// Toplu içe aktarım biçimi ve doğrulayıcısı. Belgesi: docs/ICE_AKTARIM.md.
// Aynı dosya tekrar yüklenirse dis_kimlik / kod üzerinden güncellenir, kopya oluşmaz.

import type { IcerikTuru, SoruTuru } from './tipler'

export interface IceAktarimUnitesi {
  ders?: string // varsayılan FIZ
  seviye: string // '9' | '10' | '11' | '12' | 'TYT' | 'AYT'
  no: number
  ad: string
}

export interface IceAktarimKazanimi {
  kod: string
  metin: string
  unite: { ders?: string; seviye: string; no: number }
  sira?: number
}

export interface IceAktarimSecenegi {
  harf: 'A' | 'B' | 'C' | 'D' | 'E'
  metin: string
  gerekce?: string
}

export interface IceAktarimSorusu {
  dis_kimlik: string
  tur: SoruTuru
  govde: string
  sekil_svg?: string | null
  secenekler?: IceAktarimSecenegi[] | null
  dogru_cevap: string
  cozum_adimlari?: (string | { metin: string })[]
  zorluk: number
  baglam_temelli?: boolean
  kazanimlar: string[]
  kaynak_notu?: string | null
  beceri?: string | null
  kavram_yanilgisi?: string | null
  puanlama_olcutu?: string | null
  ornek?: boolean
  yayinda?: boolean
}

export interface IceAktarimIcerigi {
  dis_kimlik: string
  tur: IcerikTuru
  baslik: string
  aciklama?: string | null
  unite?: { ders?: string; seviye: string; no: number } | null
  hafta?: number | null
  sira?: number
  kazanimlar?: string[]
  /** Yapılandırılmış içerik (konu anlatımı): { bolumler: [{ baslik, metin, sekil_svg? }], planlar?: { "40": [...] } } */
  veri?: unknown
  /** Uygulamayla yayınlanan dosya yolu ('/...') ya da Storage 'icerik' kovasındaki yol. */
  html_yolu?: string | null
  meb_baglanti?: string | null
  ornek?: boolean
  yayinda?: boolean
}

export interface IceAktarimDosyasi {
  surum: 1
  kaynak?: string
  katalog?: { uniteler?: IceAktarimUnitesi[]; kazanimlar?: IceAktarimKazanimi[] }
  sorular?: IceAktarimSorusu[]
  icerikler?: IceAktarimIcerigi[]
}

export interface DogrulamaSonucu {
  gecerli: boolean
  hatalar: string[]
  uyarilar: string[]
  ozet: { uniteler: number; kazanimlar: number; sorular: number; icerikler: number }
}

const HARFLER = ['A', 'B', 'C', 'D', 'E']
const SEVIYELER = ['9', '10', '11', '12', 'TYT', 'AYT']
const SORU_TURLERI: SoruTuru[] = ['coktan_secmeli', 'dogru_yanlis', 'acik_uclu']
const ICERIK_TURLERI: IcerikTuru[] = ['hafta_kiti', 'konu_anlatimi', 'sunum']
const KAZANIM_KODU = /^[A-ZÇĞİÖŞÜ]{2,5}\.(\d{1,2}|TYT|AYT)\.\d{1,2}\.\d{1,2}$/

const metinMi = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0

/**
 * Dosyayı doğrular. bilinenKazanimlar: veritabanında zaten olan kazanım kodları;
 * dosyada da tanımlanabilir. Hatalı satır varsa hiçbiri aktarılmaz.
 */
export function iceAktarimDogrula(veri: unknown, bilinenKazanimlar: ReadonlySet<string> = new Set()): DogrulamaSonucu {
  const hatalar: string[] = []
  const uyarilar: string[] = []
  const ozet = { uniteler: 0, kazanimlar: 0, sorular: 0, icerikler: 0 }
  const h = (m: string) => hatalar.push(m)

  if (typeof veri !== 'object' || veri === null || Array.isArray(veri)) {
    return { gecerli: false, hatalar: ['Dosya bir JSON nesnesi olmalı.'], uyarilar, ozet }
  }
  const d = veri as Record<string, unknown>
  if (d.surum !== 1) h('"surum" alanı 1 olmalı.')

  const kazanimlar = new Set(bilinenKazanimlar)
  const katalog = (d.katalog ?? {}) as Record<string, unknown>
  const uniteAnahtarlari = new Set<string>()
  if (katalog.uniteler !== undefined) {
    if (!Array.isArray(katalog.uniteler)) h('katalog.uniteler bir dizi olmalı.')
    else
      katalog.uniteler.forEach((u: Record<string, unknown>, i) => {
        const y = `katalog.uniteler[${i}]`
        if (!SEVIYELER.includes(String(u.seviye))) h(`${y}: seviye ${SEVIYELER.join(', ')} değerlerinden biri olmalı.`)
        if (!Number.isInteger(u.no) || (u.no as number) < 1) h(`${y}: no pozitif tam sayı olmalı.`)
        if (!metinMi(u.ad)) h(`${y}: ad boş olamaz.`)
        uniteAnahtarlari.add(`${u.seviye}/${u.no}`)
        ozet.uniteler++
      })
  }
  if (katalog.kazanimlar !== undefined) {
    if (!Array.isArray(katalog.kazanimlar)) h('katalog.kazanimlar bir dizi olmalı.')
    else
      katalog.kazanimlar.forEach((k: Record<string, unknown>, i) => {
        const y = `katalog.kazanimlar[${i}]`
        if (!metinMi(k.kod) || !KAZANIM_KODU.test(k.kod)) h(`${y}: kod "FİZ.9.3.5" biçiminde olmalı.`)
        if (!metinMi(k.metin)) h(`${y}: metin boş olamaz.`)
        const u = k.unite as Record<string, unknown> | undefined
        if (!u || !SEVIYELER.includes(String(u.seviye)) || !Number.isInteger(u.no)) h(`${y}: unite { seviye, no } gerekli.`)
        if (metinMi(k.kod)) kazanimlar.add(k.kod)
        ozet.kazanimlar++
      })
  }

  const disKimlikler = new Set<string>()
  const disKimlikDenetle = (y: string, x: unknown) => {
    if (!metinMi(x)) h(`${y}: dis_kimlik gerekli (tekrar yüklemede güncelleme için).`)
    else if (disKimlikler.has(x)) h(`${y}: dis_kimlik "${x}" dosyada iki kez geçiyor.`)
    else disKimlikler.add(x)
  }

  if (d.sorular !== undefined && !Array.isArray(d.sorular)) h('"sorular" bir dizi olmalı.')
  ;((d.sorular as Record<string, unknown>[] | undefined) ?? []).forEach((s, i) => {
    const y = `sorular[${i}]${metinMi(s.dis_kimlik) ? ` (${s.dis_kimlik})` : ''}`
    ozet.sorular++
    disKimlikDenetle(y, s.dis_kimlik)
    if (!SORU_TURLERI.includes(s.tur as SoruTuru)) h(`${y}: tur ${SORU_TURLERI.join(', ')} değerlerinden biri olmalı.`)
    if (!metinMi(s.govde)) h(`${y}: govde boş olamaz.`)
    if (!Number.isInteger(s.zorluk) || (s.zorluk as number) < 1 || (s.zorluk as number) > 5) h(`${y}: zorluk 1-5 arası tam sayı olmalı.`)
    if (!metinMi(s.dogru_cevap)) h(`${y}: dogru_cevap boş olamaz.`)
    if (s.tur === 'coktan_secmeli') {
      const sec = s.secenekler as Record<string, unknown>[] | undefined
      if (!Array.isArray(sec) || sec.length !== 5) h(`${y}: çoktan seçmeli soruda tam 5 seçenek olmalı.`)
      else {
        sec.forEach((x, j) => {
          if (x.harf !== HARFLER[j]) h(`${y}: ${j + 1}. seçeneğin harfi ${HARFLER[j]} olmalı.`)
          if (!metinMi(x.metin)) h(`${y}: ${HARFLER[j]} seçeneğinin metni boş.`)
          if (x.gerekce !== undefined && x.harf === s.dogru_cevap) uyarilar.push(`${y}: doğru şıkta gerekçe var; tahtada gösterilmez.`)
        })
        if (new Set(sec.map((x) => String(x.metin).trim())).size !== 5) h(`${y}: seçenekler birbirinden farklı olmalı.`)
      }
      if (!HARFLER.includes(String(s.dogru_cevap))) h(`${y}: dogru_cevap A-E arası olmalı.`)
    } else if (s.tur === 'dogru_yanlis') {
      if (!['D', 'Y'].includes(String(s.dogru_cevap))) h(`${y}: doğru/yanlış sorusunda dogru_cevap D ya da Y olmalı.`)
      if (s.secenekler) h(`${y}: doğru/yanlış sorusunda seçenek olmaz.`)
    } else if (s.secenekler) h(`${y}: açık uçlu soruda seçenek olmaz.`)
    if (s.sekil_svg !== undefined && s.sekil_svg !== null) {
      if (!metinMi(s.sekil_svg) || !/^\s*<svg[\s>]/.test(s.sekil_svg)) h(`${y}: sekil_svg tek bir <svg> öğesi olmalı.`)
      else if (/<script|on\w+=|javascript:/i.test(s.sekil_svg)) h(`${y}: sekil_svg betik ya da olay özniteliği içeremez.`)
    }
    const kz = s.kazanimlar
    if (!Array.isArray(kz) || kz.length === 0) h(`${y}: en az bir kazanım kodu gerekli.`)
    else kz.forEach((k) => !kazanimlar.has(String(k)) && h(`${y}: "${k}" kazanımı katalogda yok; dosyanın katalog bölümüne ekleyin.`))
    if (s.cozum_adimlari !== undefined && !Array.isArray(s.cozum_adimlari)) h(`${y}: cozum_adimlari bir dizi olmalı.`)
    if (metinMi(s.govde) && s.govde.includes('·')) uyarilar.push(`${y}: gövdede "·" var; çarpma için × kullanın.`)
  })

  if (d.icerikler !== undefined && !Array.isArray(d.icerikler)) h('"icerikler" bir dizi olmalı.')
  ;((d.icerikler as Record<string, unknown>[] | undefined) ?? []).forEach((c, i) => {
    const y = `icerikler[${i}]${metinMi(c.dis_kimlik) ? ` (${c.dis_kimlik})` : ''}`
    ozet.icerikler++
    disKimlikDenetle(y, c.dis_kimlik)
    if (!ICERIK_TURLERI.includes(c.tur as IcerikTuru)) h(`${y}: tur ${ICERIK_TURLERI.join(', ')} değerlerinden biri olmalı.`)
    if (!metinMi(c.baslik)) h(`${y}: baslik boş olamaz.`)
    if (!c.veri && !metinMi(c.html_yolu)) h(`${y}: veri ya da html_yolu gerekli.`)
    if (c.veri) {
      const b = (c.veri as Record<string, unknown>).bolumler as Record<string, unknown>[] | undefined
      if (!Array.isArray(b) || b.length === 0) h(`${y}: veri.bolumler en az bir bölüm içeren bir dizi olmalı.`)
      else
        b.forEach((x, j) => {
          if (!metinMi(x.baslik) || !metinMi(x.metin)) h(`${y}: veri.bolumler[${j}] için baslik ve metin gerekli.`)
          if (metinMi(x.sekil_svg) && /<script|on\w+=|javascript:/i.test(x.sekil_svg)) h(`${y}: veri.bolumler[${j}].sekil_svg betik içeremez.`)
        })
    }
    ;((c.kazanimlar as unknown[] | undefined) ?? []).forEach(
      (k) => !kazanimlar.has(String(k)) && h(`${y}: "${k}" kazanımı katalogda yok.`),
    )
  })

  return { gecerli: hatalar.length === 0, hatalar, uyarilar, ozet }
}

/** Çözüm adımlarını veritabanı biçimine çevirir. */
export const adimlariDuzenle = (a: IceAktarimSorusu['cozum_adimlari']) =>
  (a ?? []).map((x) => (typeof x === 'string' ? { metin: x } : { metin: x.metin }))
