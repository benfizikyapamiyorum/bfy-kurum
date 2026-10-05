import { describe, expect, it } from 'vitest'
import { egilim, ogrenciOzetleri, zayifKazanimlar } from './rapor'

describe('raporlar', () => {
  it('zayıf kazanımlar: eşik altı ve yeterli deneme, en zayıf önce', () => {
    const l = [
      { kazanim_id: 'a', deneme: 10, yuzde: 70 },
      { kazanim_id: 'b', deneme: 10, yuzde: 40 },
      { kazanim_id: 'c', deneme: 2, yuzde: 0 },
      { kazanim_id: 'd', deneme: 8, yuzde: 12.5 },
      { kazanim_id: 'e', deneme: 5, yuzde: 50 },
    ]
    expect(zayifKazanimlar(l).map((k) => k.kazanim_id)).toEqual(['d', 'b'])
  })

  it('eğilim', () => {
    expect(egilim([5])).toBeNull()
    expect(egilim([5, 7, 9])).toBe('artiyor')
    expect(egilim([9, 8, 6])).toBe('azaliyor')
    expect(egilim([6, 6.1, 5.9])).toBe('sabit')
  })

  it('öğrenci özeti', () => {
    const m = ogrenciOzetleri([
      { ogrenci_id: 'x', net: 5 },
      { ogrenci_id: 'y', net: 2 },
      { ogrenci_id: 'x', net: 7.5 },
    ])
    expect(m.get('x')).toEqual({ ogrenci_id: 'x', sinav: 2, ortalama: 6.25, son: 7.5, netler: [5, 7.5] })
  })
})
