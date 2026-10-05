import type { Kurum } from './tipler'

export interface LisansDurumu {
  gecerli: boolean
  kalanGun: number
  mesaj: string
}

const gun = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10))

/** Lisansın bugünkü durumu. Bitiş günü dahil geçerlidir. */
export function lisansDurumu(k: Pick<Kurum, 'aktif' | 'lisans_baslangic' | 'lisans_bitis'>, bugun = new Date()): LisansDurumu {
  const b = Date.UTC(bugun.getFullYear(), bugun.getMonth(), bugun.getDate())
  const kalanGun = Math.round((gun(k.lisans_bitis) - b) / 864e5)
  if (!k.aktif) return { gecerli: false, kalanGun, mesaj: 'Kurum hesabı kapalı.' }
  if (b < gun(k.lisans_baslangic)) return { gecerli: false, kalanGun, mesaj: 'Lisans henüz başlamadı.' }
  if (kalanGun < 0) return { gecerli: false, kalanGun, mesaj: 'Lisans süresi doldu.' }
  if (kalanGun === 0) return { gecerli: true, kalanGun, mesaj: 'Lisans bugün sona eriyor.' }
  return { gecerli: true, kalanGun, mesaj: `Lisansın bitmesine ${kalanGun} gün var.` }
}

export const tarihYaz = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
