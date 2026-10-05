import { describe, expect, it } from 'vitest'
import { netHesapla } from '../alan/puanlama'
import { katalog } from '../veri/katalog'
import { DEMO_KAZANIMLAR, DEMO_OGRENCILER, DEMO_SORU_SAYISI, DEMO_TESTLER } from './ornekRapor'

describe('demo rapor verisi', () => {
  it('her sonuç tutarlı: D + Y + B = 20, net gerçek kuralla', () => {
    for (const o of DEMO_OGRENCILER) {
      expect(o.sonuclar).toHaveLength(DEMO_TESTLER.length)
      for (const s of o.sonuclar) {
        expect(s.dogru + s.yanlis + s.bos).toBe(DEMO_SORU_SAYISI)
        expect(s.bos).toBeGreaterThanOrEqual(0)
        expect(s.net).toBe(netHesapla(s.dogru, s.yanlis))
      }
    }
  })
  it('kazanım kodları katalogda var ve doğru sayısı deneme sayısını aşmaz', () => {
    const kodlar = new Set(katalog.kazanimlar.map((k) => k.kod))
    for (const k of DEMO_KAZANIMLAR) {
      expect(kodlar.has(k.kod)).toBe(true)
      expect(k.dogru).toBeLessThanOrEqual(k.deneme)
    }
  })
})
