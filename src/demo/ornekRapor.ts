// Demo raporunun örnek verisi: kurgusal bir 9. sınıf, 6 öğrenci, 5 deneme (20'şer soru).
// Netler gerçek kuralla (netHesapla) hesaplanır; öğrenme çıktısı yüzdeleri doğru/deneme sayısından gelir.

import { netHesapla } from '../alan/puanlama'

export const DEMO_SORU_SAYISI = 20

export const DEMO_TESTLER = [
  { baslik: 'Birimler mini testi', tarih: '2026-09-22' },
  { baslik: 'Vektörler 1', tarih: '2026-09-29' },
  { baslik: 'Vektörler 2', tarih: '2026-10-06' },
  { baslik: 'Kuvvetler', tarih: '2026-10-13' },
  { baslik: 'Hareket kavramları', tarih: '2026-10-20' },
] as const

// Her öğrenci için testlerdeki [doğru, yanlış]; boş = 20 − doğru − yanlış.
const HAM: { ad: string; dy: [number, number][] }[] = [
  { ad: 'Ada Yılmaz', dy: [[14, 4], [15, 3], [16, 3], [17, 2], [18, 1]] },
  { ad: 'Kerem Aydın', dy: [[9, 7], [10, 6], [12, 5], [12, 4], [14, 4]] },
  { ad: 'Elif Demir', dy: [[16, 2], [16, 3], [15, 4], [17, 2], [16, 3]] },
  { ad: 'Mert Kaya', dy: [[12, 6], [11, 7], [9, 8], [10, 8], [8, 9]] },
  { ad: 'Zeynep Arslan', dy: [[7, 5], [9, 5], [11, 4], [13, 4], [15, 3]] },
  { ad: 'Can Öztürk', dy: [[11, 5], [12, 5], [11, 6], [12, 5], [12, 4]] },
]

export interface DemoSonuc {
  test: number
  dogru: number
  yanlis: number
  bos: number
  net: number
}

export const DEMO_OGRENCILER = HAM.map((o, i) => ({
  id: `demo-ogrenci-${i + 1}`,
  ad: o.ad,
  sonuclar: o.dy.map(
    ([dogru, yanlis], test): DemoSonuc => ({ test, dogru, yanlis, bos: DEMO_SORU_SAYISI - dogru - yanlis, net: netHesapla(dogru, yanlis) }),
  ),
}))

/** Sınıfın öğrenme çıktısı başarısı (deneme: bu çıktıya ait cevaplanan soru sayısı). */
export const DEMO_KAZANIMLAR: { kod: string; dogru: number; deneme: number }[] = [
  { kod: 'FİZ.9.2.1', dogru: 98, deneme: 120 },
  { kod: 'FİZ.9.2.2', dogru: 81, deneme: 108 },
  { kod: 'FİZ.9.2.3', dogru: 50, deneme: 114 },
  { kod: 'FİZ.9.2.4', dogru: 39, deneme: 96 },
  { kod: 'FİZ.9.2.5', dogru: 70, deneme: 102 },
  { kod: 'FİZ.9.2.6', dogru: 61, deneme: 90 },
]
