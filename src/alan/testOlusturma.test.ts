import { describe, expect, it } from 'vitest'
import type { Soru } from './tipler'
import {
  TekrarEdenSoruHatasi,
  otomatikTestOlustur,
  tekrarEdenler,
  testeSoruEkle,
  tohumluRastgele,
  zorlukBandi,
  zorlukHedefleri,
} from './testOlusturma'

const soru = (id: string, zorluk: Soru['zorluk'], kazanimlar: string[]): Soru => ({
  id,
  tur: 'coktan_secmeli',
  govde: id,
  sekil_svg: null,
  secenekler: null,
  dogru_cevap: 'A',
  cozum_adimlari: [],
  zorluk,
  baglam_temelli: false,
  kaynak_notu: null,
  ornek: false,
  kazanim_idleri: kazanimlar,
})

// 3 kazanım, her birinde her zorluktan bir soru: 15 soru.
const havuz: Soru[] = []
for (const k of ['k1', 'k2', 'k3']) {
  for (const z of [1, 2, 3, 4, 5] as const) havuz.push(soru(`${k}-z${z}`, z, [k]))
}
// Birden çok kazanıma bağlı bir soru.
havuz.push(soru('ortak', 3, ['k1', 'k2']))

describe('aynı soru tekrar etmez', () => {
  it('testeSoruEkle tekrarı reddeder', () => {
    const liste = testeSoruEkle(testeSoruEkle([], 'a'), 'b')
    expect(liste).toEqual(['a', 'b'])
    expect(() => testeSoruEkle(liste, 'a')).toThrow(TekrarEdenSoruHatasi)
  })

  it('tekrarEdenler tekrarları bulur', () => {
    expect(tekrarEdenler(['a', 'b', 'a', 'c', 'b', 'a'])).toEqual(['a', 'b'])
    expect(tekrarEdenler(['a', 'b'])).toEqual([])
  })

  it('otomatik test hiçbir tohumda tekrar üretmez', () => {
    for (let tohum = 1; tohum <= 200; tohum++) {
      const { soruIdleri } = otomatikTestOlustur({
        havuz: [...havuz, ...havuz], // havuzda aynı soru iki kez olsa bile
        kazanimIdleri: ['k1', 'k2', 'k3'],
        adet: 16,
        rastgele: tohumluRastgele(tohum),
      })
      expect(tekrarEdenler(soruIdleri)).toEqual([])
      expect(soruIdleri).toHaveLength(16)
    }
  })
})

describe('otomatik test', () => {
  it('yalnızca seçilen kazanımlardan soru alır', () => {
    const { soruIdleri } = otomatikTestOlustur({
      havuz,
      kazanimIdleri: ['k2'],
      adet: 5,
      rastgele: tohumluRastgele(7),
    })
    expect(soruIdleri.every((id) => id.startsWith('k2-') || id === 'ortak')).toBe(true)
  })

  it('zorluğu dengeler ve kolaydan zora sıralar', () => {
    const { soruIdleri, uyarilar } = otomatikTestOlustur({
      havuz,
      kazanimIdleri: ['k1', 'k2', 'k3'],
      adet: 10,
      rastgele: tohumluRastgele(3),
    })
    const zorluklar = soruIdleri.map((id) => havuz.find((s) => s.id === id)!.zorluk)
    const bantlar = zorluklar.map(zorlukBandi)
    expect(bantlar.filter((b) => b === 'kolay')).toHaveLength(3)
    expect(bantlar.filter((b) => b === 'orta')).toHaveLength(4)
    expect(bantlar.filter((b) => b === 'zor')).toHaveLength(3)
    expect([...zorluklar].sort((a, b) => a - b)).toEqual(zorluklar)
    expect(uyarilar).toEqual([])
  })

  it('kazanımlara dengeli dağıtır', () => {
    const { soruIdleri } = otomatikTestOlustur({
      havuz: havuz.filter((s) => s.id !== 'ortak'),
      kazanimIdleri: ['k1', 'k2', 'k3'],
      adet: 9,
      rastgele: tohumluRastgele(11),
    })
    for (const k of ['k1', 'k2', 'k3']) {
      expect(soruIdleri.filter((id) => id.startsWith(`${k}-`))).toHaveLength(3)
    }
  })

  it('daha önce verilen soruları ancak havuz yetmezse kullanır ve uyarır', () => {
    const verilen = new Set(havuz.filter((s) => s.kazanim_idleri.includes('k1')).map((s) => s.id))
    const az = otomatikTestOlustur({
      havuz,
      kazanimIdleri: ['k1'],
      adet: 3,
      dahaOnceVerilenler: verilen,
      rastgele: tohumluRastgele(5),
    })
    expect(az.soruIdleri).toHaveLength(3)
    expect(az.uyarilar[0]).toContain('daha önce verilmişti')

    const k2li = otomatikTestOlustur({
      havuz,
      kazanimIdleri: ['k1', 'k2'],
      adet: 5,
      dahaOnceVerilenler: verilen,
      rastgele: tohumluRastgele(5),
    })
    expect(k2li.soruIdleri.some((id) => verilen.has(id))).toBe(false)
    expect(k2li.uyarilar).toEqual([])
  })

  it('havuz yetmezse bulabildiği kadarını verir', () => {
    const { soruIdleri, uyarilar } = otomatikTestOlustur({
      havuz,
      kazanimIdleri: ['k3'],
      adet: 50,
      rastgele: tohumluRastgele(1),
    })
    expect(soruIdleri).toHaveLength(5)
    expect(uyarilar).toContain('İstenen 50 soru yerine 5 soru bulunabildi.')
  })
})

describe('zorlukHedefleri', () => {
  it('toplam her zaman istenen adettir', () => {
    for (let n = 0; n <= 40; n++) {
      const h = zorlukHedefleri(n)
      expect(h.kolay + h.orta + h.zor).toBe(n)
    }
  })
})
