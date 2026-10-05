// Toplu öğrenci ekleme için CSV / Excel tablosunu çözümler.
// Desteklenen sütun başlıkları (büyük/küçük harf ve Türkçe karakter farkı önemsiz):
//   Ad Soyad (zorunlu) | Ad + Soyad (ayrı sütunlar) | Sınıf | Kullanıcı adı | Şifre
// Başlık satırı yoksa ilk sütun ad soyad, ikinci sütun sınıf kabul edilir.

import { asciiyeCevir } from './kullaniciAdi'

export interface OgrenciSatiri {
  satir: number
  ad_soyad: string
  sinif: string | null
  kullanici_adi: string | null
  sifre: string | null
}

export interface ListeSonucu {
  ogrenciler: OgrenciSatiri[]
  uyarilar: string[]
}

/** CSV metnini hücrelere ayırır. Ayraç ; , ya da sekme olabilir (Türkçe Excel ; kullanır). */
export function csvCozumle(metin: string): string[][] {
  const temiz = metin.replace(/^\uFEFF/, '')
  const ilkSatir = temiz.split(/\r?\n/, 1)[0] ?? ''
  const ayrac = (['\t', ';', ','] as const).reduce((enIyi, a) =>
    ilkSatir.split(a).length > ilkSatir.split(enIyi).length ? a : enIyi,
  )
  const satirlar: string[][] = []
  let hucre = ''
  let satir: string[] = []
  let tirnak = false
  for (let i = 0; i < temiz.length; i++) {
    const c = temiz[i]!
    if (tirnak) {
      if (c === '"' && temiz[i + 1] === '"') {
        hucre += '"'
        i++
      } else if (c === '"') tirnak = false
      else hucre += c
    } else if (c === '"') tirnak = true
    else if (c === ayrac) {
      satir.push(hucre)
      hucre = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && temiz[i + 1] === '\n') i++
      satir.push(hucre)
      satirlar.push(satir)
      satir = []
      hucre = ''
    } else hucre += c
  }
  if (hucre !== '' || satir.length > 0) {
    satir.push(hucre)
    satirlar.push(satir)
  }
  return satirlar.filter((s) => s.some((h) => h.trim() !== ''))
}

/** Dosya baytlarını metne çevirir: önce UTF-8, olmazsa Türkçe Windows (1254). */
export function metneCevir(baytlar: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(baytlar)
  } catch {
    return new TextDecoder('windows-1254').decode(baytlar)
  }
}

const anahtar = (s: string) => asciiyeCevir(s).replace(/\s+/g, '')

const BASLIKLAR: Record<string, keyof Omit<OgrenciSatiri, 'satir'> | 'ad' | 'soyad'> = {
  adsoyad: 'ad_soyad',
  adisoyadi: 'ad_soyad',
  ogrenci: 'ad_soyad',
  ogrenciadisoyadi: 'ad_soyad',
  isim: 'ad_soyad',
  ad: 'ad',
  adi: 'ad',
  soyad: 'soyad',
  soyadi: 'soyad',
  sinif: 'sinif',
  sube: 'sinif',
  sinifsube: 'sinif',
  kullaniciadi: 'kullanici_adi',
  kullanici: 'kullanici_adi',
  sifre: 'sifre',
  parola: 'sifre',
}

export function ogrenciListesiCozumle(tablo: unknown[][]): ListeSonucu {
  const hucreler = tablo.map((s) => s.map((h) => (h === null || h === undefined ? '' : String(h).trim())))
  const uyarilar: string[] = []
  if (hucreler.length === 0) return { ogrenciler: [], uyarilar: ['Dosyada satır bulunamadı.'] }

  const ilk = hucreler[0]!
  const eslesme = ilk.map((h) => BASLIKLAR[anahtar(h)])
  const baslikVar = eslesme.some((e) => e === 'ad_soyad' || e === 'ad')
  const sutun = (ad: string) => (baslikVar ? eslesme.indexOf(ad as never) : -1)
  const iAdSoyad = baslikVar ? sutun('ad_soyad') : 0
  const iAd = sutun('ad')
  const iSoyad = sutun('soyad')
  const iSinif = baslikVar ? sutun('sinif') : 1
  const iKadi = sutun('kullanici_adi')
  const iSifre = sutun('sifre')

  const ogrenciler: OgrenciSatiri[] = []
  hucreler.slice(baslikVar ? 1 : 0).forEach((s, j) => {
    const satirNo = j + (baslikVar ? 2 : 1)
    const ad =
      iAdSoyad >= 0
        ? (s[iAdSoyad] ?? '')
        : [iAd >= 0 ? s[iAd] : '', iSoyad >= 0 ? s[iSoyad] : ''].filter(Boolean).join(' ')
    const adSoyad = ad.replace(/\s+/g, ' ').trim()
    if (adSoyad.length < 2) {
      uyarilar.push(`${satirNo}. satırda ad soyad yok; atlandı.`)
      return
    }
    const bos = (i: number) => (i >= 0 && s[i] ? s[i]! : null)
    ogrenciler.push({
      satir: satirNo,
      ad_soyad: adSoyad,
      sinif: bos(iSinif),
      kullanici_adi: bos(iKadi)?.toLocaleLowerCase('tr-TR') ?? null,
      sifre: bos(iSifre),
    })
  })
  return { ogrenciler, uyarilar }
}
