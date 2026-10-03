import { describe, expect, it } from 'vitest'
import { trBuyuk, trKucuk, trSayi, trSirala } from './turkce'

describe('Türkçe metin işlemleri', () => {
  it('büyük/küçük harf dönüşümünde İ ve ı doğru', () => {
    expect(trBuyuk('iğne ılık şeker')).toBe('İĞNE ILIK ŞEKER')
    expect(trKucuk('IŞIK İVME')).toBe('ışık ivme')
  })

  it('Türkçe alfabe sırasıyla sıralar', () => {
    const adlar = ['Zeynep', 'Çağla', 'Ömer', 'Cem', 'Şule', 'Ilgaz', 'İrem', 'Sema', 'Oğuz', 'Ümit', 'Uğur']
    expect(trSirala(adlar, (x) => x)).toEqual([
      'Cem', 'Çağla', 'Ilgaz', 'İrem', 'Oğuz', 'Ömer', 'Sema', 'Şule', 'Uğur', 'Ümit', 'Zeynep',
    ])
  })

  it('sınıf adlarını sayısal sıralar', () => {
    expect(trSirala(['10-A', '9-B', '11-A Sayısal', '9-A'], (x) => x)).toEqual([
      '9-A', '9-B', '10-A', '11-A Sayısal',
    ])
  })

  it('ondalık virgül kullanır', () => {
    expect(trSayi(2.5)).toBe('2,5')
    expect(trSayi(9.25)).toBe('9,25')
  })
})
