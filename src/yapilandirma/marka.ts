// Ürün adı ve marka bilgileri yalnızca marka.json dosyasından gelir.
// Kodun hiçbir yerinde marka adı sabit yazılmaz; ürün adı değişince yalnızca bu JSON düzenlenir.

import veri from './marka.json'

export interface Marka {
  urunAdi: string
  urunKisaAdi: string
  sahipAdi: string
  web: string
  sosyalMedya: string
  iletisimEposta: string
  programIbaresi: string
  anaRenk: string
  demoKurumAdi: string
}

export const marka: Readonly<Marka> = Object.freeze(veri)
