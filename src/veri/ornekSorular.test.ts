// Örnek soruların biçim kurallarını denetler ve her sayısal sonucu kodla yeniden hesaplar.

import { describe, expect, it } from 'vitest'
import { katalog } from './katalog'
import { ornekSorular } from './ornekSorular'

const g = 10

describe('örnek sorular: biçim', () => {
  it('en fazla 10 soru var ve hepsi ornek = true', () => {
    expect(ornekSorular.length).toBeLessThanOrEqual(10)
    expect(ornekSorular.every((s) => s.ornek)).toBe(true)
  })

  it('kimlikler tekil', () => {
    expect(new Set(ornekSorular.map((s) => s.id)).size).toBe(ornekSorular.length)
  })

  it('her soru en az bir geçerli kazanıma bağlı', () => {
    const gecerli = new Set(katalog.kazanimlar.map((k) => k.id))
    for (const s of ornekSorular) {
      expect(s.kazanim_idleri.length).toBeGreaterThan(0)
      for (const k of s.kazanim_idleri) expect(gecerli.has(k)).toBe(true)
    }
  })

  it('soru türüyle şık ve cevap tutarlı', () => {
    for (const s of ornekSorular) {
      if (s.tur === 'coktan_secmeli') {
        expect(s.secenekler?.map((x) => x.harf)).toEqual(['A', 'B', 'C', 'D', 'E'])
        expect(['A', 'B', 'C', 'D', 'E']).toContain(s.dogru_cevap)
        // Şıklar birbirinden farklı olmalı.
        expect(new Set(s.secenekler?.map((x) => x.metin)).size).toBe(5)
      } else if (s.tur === 'dogru_yanlis') {
        expect(s.secenekler).toBeNull()
        expect(['D', 'Y']).toContain(s.dogru_cevap)
      } else {
        expect(s.secenekler).toBeNull()
      }
    }
  })

  it('her sorunun en az iki çözüm adımı var', () => {
    for (const s of ornekSorular) expect(s.cozum_adimlari.length).toBeGreaterThanOrEqual(2)
  })

  it('çoktan seçmeli cevaplar şıklara dengeli dağılmış (hep aynı harf değil)', () => {
    const harfler = ornekSorular.filter((s) => s.tur === 'coktan_secmeli').map((s) => s.dogru_cevap)
    expect(new Set(harfler).size).toBeGreaterThanOrEqual(3)
  })

  it('yazım kuralları: orta nokta yok, cümleler noktayla biter', () => {
    for (const s of ornekSorular) {
      const metinler = [s.govde, ...s.cozum_adimlari.map((a) => a.metin), s.sekil_svg ?? '']
      for (const m of metinler) {
        expect(m).not.toContain('·')
        expect(m).not.toContain('\\cdot')
      }
      for (const a of s.cozum_adimlari) expect(a.metin.trim()).toMatch(/[.]$/)
      expect(s.govde.trim()).toMatch(/[.?)]$/)
    }
  })

  it('şekiller tek bir svg öğesi ve gradyan kimlikleri sorular arasında çakışmıyor', () => {
    const kimlikler = new Map<string, string>()
    for (const s of ornekSorular) {
      if (!s.sekil_svg) continue
      expect(s.sekil_svg.startsWith('<svg')).toBe(true)
      expect(s.sekil_svg.match(/<svg/g)).toHaveLength(1)
      for (const [, id] of s.sekil_svg.matchAll(/\sid="([^"]+)"/g)) {
        const sahibi = kimlikler.get(id!)
        if (sahibi) expect(sahibi).toBe(s.id)
        kimlikler.set(id!, s.id)
      }
    }
  })
})

describe('örnek sorular: fizik sonuçları kodla yeniden hesaplanır', () => {
  const soru = (n: number) => ornekSorular[n - 1]!
  const secenek = (n: number) => soru(n).secenekler!.find((x) => x.harf === soru(n).dogru_cevap)!.metin

  it('1: K + L + M = 0', () => {
    const K = +4
    const L = -6
    const M = -(K + L)
    expect(M).toBe(2) // 2 birim sağa
    expect(secenek(1)).toBe('2 birim, sağa doğru')
  })

  it('2: kapalı turda yer değiştirme sıfır, yol 400 m', () => {
    expect(soru(2).dogru_cevap).toBe('Y')
  })

  it('4: karşılaşma konumu', () => {
    const vK = (60 - 0) / 6
    const vL = (30 - 60) / 6
    expect([vK, vL]).toEqual([10, -5])
    const t = (60 - 0) / (vK - vL)
    expect(t).toBe(4)
    expect(vK * t).toBe(40)
    expect(secenek(4)).toBe('40 m')
  })

  it('5: ivmeler ve alınan yol', () => {
    const a1 = (12 - 0) / 4
    const a2 = (12 - 12) / 4
    const a3 = (0 - 12) / 2
    expect([a1, a2, a3]).toEqual([3, 0, -6])
    const yol = (4 * 12) / 2 + 4 * 12 + (2 * 12) / 2
    expect(yol).toBe(84)
    // Sabit ivmeli hareket denklemleriyle aynı sonuç:
    const x1 = 0.5 * a1 * 4 ** 2
    const x2 = 12 * 4
    const x3 = 12 * 2 + 0.5 * a3 * 2 ** 2
    expect(x1 + x2 + x3).toBe(84)
    expect(soru(5).dogru_cevap).toContain('84 m')
  })

  it('6: fren ivmesi', () => {
    const a = (8 - 20) / 4
    expect(a).toBe(-3)
    expect(secenek(6)).toBe('3 m/s², hareket yönüne zıt')
  })

  it('7: son 1 saniyede alınan yol', () => {
    const t = Math.sqrt((2 * 80) / g)
    expect(t).toBe(4)
    const son = 80 - 0.5 * g * (t - 1) ** 2
    expect(son).toBe(35)
    expect(secenek(7)).toBe('35')
  })

  it('8: yatay atış', () => {
    const t = Math.sqrt((2 * 45) / g)
    expect(t).toBe(3)
    expect(20 * t).toBe(60)
    expect(g * t).toBe(30)
    expect(soru(8).dogru_cevap).toContain('60 m')
  })

  it('9: ip gerilmesi', () => {
    const a = 20 / (2 + 3)
    expect(a).toBe(4)
    expect(2 * a).toBe(8)
    // L bloğu için de denetim: F − T = m_L a
    expect(20 - 2 * a).toBe(3 * a)
    expect(secenek(9)).toBe('8')
  })

  it('şekillerdeki ölçekler sayısal verilerle tutarlı', () => {
    // 7: 80 m = 260 px; ivme 2 × 260 / 4² = 32,5 px/s²
    expect((2 * 260) / 4 ** 2).toBe(32.5)
    expect(soru(7).sekil_svg).toContain('data-ciz-a="0,32.5"')
    // 8: 4 px/m; 20 m/s = 80 px/s; 10 m/s² = 40 px/s²; 3 s sonra (126 + 240, 82 + 180)
    expect(126 + 80 * 3).toBe(366)
    expect(82 + 0.5 * 40 * 9).toBe(262)
    expect(soru(8).sekil_svg).toContain('Q246 82 366 262')
    // Parabolün kontrol noktası: son teğet eğimi 40×3/80 = 1,5 → 366 − 180/1,5 = 246
    expect(366 - 180 / ((40 * 3) / 80)).toBe(246)
  })
})
