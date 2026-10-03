import { describe, expect, it } from 'vitest'
import { netHesapla, puanla } from './puanlama'
import { cevapDizisiniCozumle } from './cevapDizisi'

describe('netHesapla', () => {
  it('4 yanlış 1 doğruyu götürür', () => {
    expect(netHesapla(30, 8)).toBe(28)
    expect(netHesapla(10, 4)).toBe(9)
    expect(netHesapla(10, 3)).toBe(9.25)
    expect(netHesapla(0, 0)).toBe(0)
  })

  it('oran ayarlanabilir', () => {
    expect(netHesapla(10, 3, 3)).toBe(9)
    expect(netHesapla(10, 1, 3)).toBe(9.67)
  })

  it('oran 0 ise yanlışlar doğruyu götürmez', () => {
    expect(netHesapla(12, 7, 0)).toBe(12)
  })

  it('net eksiye düşebilir', () => {
    expect(netHesapla(0, 6)).toBe(-1.5)
  })

  it('geçersiz girdiyi reddeder', () => {
    expect(() => netHesapla(-1, 0)).toThrow(RangeError)
    expect(() => netHesapla(1.5, 0)).toThrow(RangeError)
    expect(() => netHesapla(1, 1, -4)).toThrow(RangeError)
  })
})

describe('puanla', () => {
  it('doğru, yanlış ve boşları sayar', () => {
    const sonuc = puanla(['A', 'b', null, 'C', '', 'E'], ['A', 'B', 'C', 'D', 'E', 'A'])
    expect(sonuc).toEqual({ dogru: 2, yanlis: 2, bos: 2, net: 1.5 })
  })

  it('cevap sayısı anahtarla aynı olmalı', () => {
    expect(() => puanla(['A'], ['A', 'B'])).toThrow(RangeError)
  })
})

describe('cevapDizisiniCozumle', () => {
  it('boşlukları yok sayar, boş işaretlerini tanır', () => {
    const s = cevapDizisiniCozumle('abcde -_.* ABC', 12)
    expect(s).toEqual({
      tamam: true,
      cevaplar: ['A', 'B', 'C', 'D', 'E', null, null, null, null, 'A', 'B', 'C'],
    })
  })

  it('Türkçe küçük harf dönüşümünde i harfini hata olarak bildirir', () => {
    const s = cevapDizisiniCozumle('ABi', 3)
    expect(s.tamam).toBe(false)
    if (!s.tamam) expect(s.hata).toBe('3. karakter ("İ") geçerli bir cevap değil.')
  })

  it('soru sayısı tutmazsa açıklayıcı hata verir', () => {
    const s = cevapDizisiniCozumle('ABCD', 5)
    expect(s).toEqual({ tamam: false, hata: 'Testte 5 soru var, 4 cevap yazıldı.' })
  })

  it('elle girişten net hesabı', () => {
    const s = cevapDizisiniCozumle('ABCDE ABCDE', 10)
    if (!s.tamam) throw new Error(s.hata)
    // 6 doğru (ilk beşi ve 8. soru), 4 yanlış: 6 − 4/4 = 5.
    expect(puanla(s.cevaplar, [...'ABCDEEDCBA'])).toEqual({ dogru: 6, yanlis: 4, bos: 0, net: 5 })
  })
})
