import { describe, expect, it } from 'vitest'
import { asciiyeCevir, kullaniciAdiOner } from './kullaniciAdi'
import { csvCozumle, metneCevir, ogrenciListesiCozumle } from './ogrenciListesi'

describe('kullanıcı adı önerisi', () => {
  it('Türkçe karakterleri çevirir, ad ve soyaddan üretir', () => {
    expect(kullaniciAdiOner('Ayşe Gül Yılmaz')).toBe('ayse.yilmaz')
    expect(kullaniciAdiOner('İSMAİL ÇAĞRI ÖZTÜRK')).toBe('ismail.ozturk')
    expect(kullaniciAdiOner('Işıl Ünal')).toBe('isil.unal')
    expect(asciiyeCevir("Ahmet O'Neil")).toBe('ahmet o neil')
  })

  it('çakışırsa sayı ekler', () => {
    expect(kullaniciAdiOner('Ali Kaya', new Set(['ali.kaya', 'ali.kaya2']))).toBe('ali.kaya3')
  })

  it('tek kelimelik adı da kabul eder', () => {
    expect(kullaniciAdiOner('Su')).toBe('su.ogr')
  })
})

describe('CSV çözümleme', () => {
  it('Türkçe Excel CSV: noktalı virgül, tırnak, BOM', () => {
    const t = csvCozumle('﻿Ad Soyad;Sınıf\r\n"Kaya; Ali";11-A\r\nAyşe Yılmaz;11-B\r\n\r\n')
    expect(t).toEqual([
      ['Ad Soyad', 'Sınıf'],
      ['Kaya; Ali', '11-A'],
      ['Ayşe Yılmaz', '11-B'],
    ])
  })

  it('virgül ve kaçışlı tırnak', () => {
    expect(csvCozumle('a,"b ""c""",d')).toEqual([['a', 'b "c"', 'd']])
  })

  it('Windows-1254 kodlu dosyayı doğru okur', () => {
    // "Şükrü Işık" Windows-1254 kodlamasıyla
    const baytlar = new Uint8Array([0xde, 0xfc, 0x6b, 0x72, 0xfc, 0x20, 0x49, 0xfe, 0xfd, 0x6b])
    expect(metneCevir(baytlar.buffer)).toBe('Şükrü Işık')
  })
})

describe('öğrenci listesi', () => {
  it('başlıkları tanır', () => {
    const s = ogrenciListesiCozumle([
      ['ÖĞRENCİ ADI SOYADI', 'Şube', 'Kullanıcı Adı', 'Şifre'],
      ['Ayşe  Yılmaz', '11-A', 'Ayse.Y', ''],
      ['', '11-A', '', ''],
      ['Mert Can', '', '', 'gizli12'],
    ])
    expect(s.ogrenciler).toEqual([
      { satir: 2, ad_soyad: 'Ayşe Yılmaz', sinif: '11-A', kullanici_adi: 'ayse.y', sifre: null },
      { satir: 4, ad_soyad: 'Mert Can', sinif: null, kullanici_adi: null, sifre: 'gizli12' },
    ])
    expect(s.uyarilar).toEqual(['3. satırda ad soyad yok; atlandı.'])
  })

  it('ad ve soyad ayrı sütunlarda olabilir', () => {
    const s = ogrenciListesiCozumle([
      ['Adı', 'Soyadı', 'Sınıf'],
      ['Elif', 'Şahin', '9-A'],
    ])
    expect(s.ogrenciler[0]).toMatchObject({ ad_soyad: 'Elif Şahin', sinif: '9-A' })
  })

  it('başlık yoksa ilk sütun ad soyad, ikinci sütun sınıf', () => {
    const s = ogrenciListesiCozumle([['Deniz Ak', '10-B']])
    expect(s.ogrenciler[0]).toMatchObject({ satir: 1, ad_soyad: 'Deniz Ak', sinif: '10-B' })
  })
})
