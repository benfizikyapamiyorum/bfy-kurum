import { describe, expect, it } from 'vitest'
import { soruTaslagiDenetle } from './soruDenetimi'

const temel = {
  tur: 'coktan_secmeli' as const,
  govde: 'Soru.',
  sekil_svg: null,
  secenekler: (['A', 'B', 'C', 'D', 'E'] as const).map((harf) => ({ harf, metin: harf })),
  dogru_cevap: 'C',
  kazanim_idleri: ['k1'],
}

describe('soru denetimi', () => {
  it('eksiksiz soru geçer', () => expect(soruTaslagiDenetle(temel)).toEqual([]))
  it('eksikleri sayar', () => {
    expect(
      soruTaslagiDenetle({ ...temel, govde: ' ', kazanim_idleri: [], secenekler: [{ harf: 'A', metin: '' }], sekil_svg: '<svg onclick="x">' }),
    ).toEqual([
      'Soru metni boş olamaz.',
      'En az bir kazanım seçin.',
      'Beş seçeneğin hepsi dolu olmalı.',
      'Şekil betik ya da olay özniteliği içeremez.',
    ])
  })
  it('doğru/yanlış ve açık uçlu cevap biçimi', () => {
    expect(soruTaslagiDenetle({ ...temel, tur: 'dogru_yanlis', secenekler: null, dogru_cevap: 'C' })).toEqual(['Doğru cevap D ya da Y olmalı.'])
    expect(soruTaslagiDenetle({ ...temel, tur: 'acik_uclu', secenekler: null, dogru_cevap: '' })).toEqual([
      'Açık uçlu soru için beklenen cevabı yazın.',
    ])
  })
})
