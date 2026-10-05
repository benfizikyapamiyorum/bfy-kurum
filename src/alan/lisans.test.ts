import { describe, expect, it } from 'vitest'
import { lisansDurumu } from './lisans'

const k = (b: string, s: string, aktif = true) => ({ aktif, lisans_baslangic: b, lisans_bitis: s })
const bugun = new Date(2026, 9, 5)

describe('lisans durumu', () => {
  it('süre içinde geçerli', () => {
    expect(lisansDurumu(k('2026-09-01', '2027-06-30'), bugun)).toMatchObject({ gecerli: true, kalanGun: 268 })
  })
  it('bitiş günü dahil', () => {
    expect(lisansDurumu(k('2026-01-01', '2026-10-05'), bugun)).toMatchObject({ gecerli: true, kalanGun: 0 })
    expect(lisansDurumu(k('2026-01-01', '2026-10-04'), bugun)).toMatchObject({ gecerli: false, mesaj: 'Lisans süresi doldu.' })
  })
  it('başlamamış ya da kapalı', () => {
    expect(lisansDurumu(k('2026-11-01', '2027-06-30'), bugun).gecerli).toBe(false)
    expect(lisansDurumu(k('2026-01-01', '2027-06-30', false), bugun).mesaj).toBe('Kurum hesabı kapalı.')
  })
})
