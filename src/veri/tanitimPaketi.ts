// Tanıtım sürümü (flash bellekte tek dosya) için ek içerik: kaldırma kuvveti paketi.
// Paket dosyası icerik-paketleri/kaldirma-kuvveti.json; burada yerel kaynağın tiplerine çevrilir.
// Yalnızca VITE_TANITIM=1 derlemesinde yüklenir; normal sürümde paket sunucudan içe aktarılır.

import paket from '../../icerik-paketleri/kaldirma-kuvveti.json'
import type { Icerik, Kazanim, KonuVerisi, Soru, Unite } from '../alan/tipler'
import { FIZIK_ID, katalog } from './katalog'

const kimlik = (onEk: string, no: number) => `${onEk}000000-0000-4000-8000-${String(no).padStart(12, '0')}`

const seviyeId = (kod: string) => katalog.seviyeler.find((s) => s.kod === kod)!.id

export const tanitimUniteleri: Unite[] = paket.katalog.uniteler
  .filter((u) => !katalog.uniteler.some((v) => v.seviye_id === seviyeId(u.seviye) && v.no === u.no))
  .map((u) => ({ id: kimlik('30', Number(u.seviye) * 100 + u.no), ders_id: FIZIK_ID, seviye_id: seviyeId(u.seviye), no: u.no, ad: u.ad }))

const uniteBul = (seviye: string, no: number) =>
  [...katalog.uniteler, ...tanitimUniteleri].find((u) => u.seviye_id === seviyeId(seviye) && u.no === no)!

export const tanitimKazanimlari: Kazanim[] = paket.katalog.kazanimlar
  .filter((k) => !katalog.kazanimlar.some((v) => v.kod === k.kod))
  .map((k) => {
    const [, sinif, unite, sira] = k.kod.split('.').map(Number) as [number, number, number, number]
    return { id: kimlik('40', sinif * 10000 + unite * 100 + sira), unite_id: uniteBul(k.unite.seviye, k.unite.no).id, kod: k.kod, metin: k.metin, sira: k.sira }
  })

const kazanimId = (kod: string) => [...katalog.kazanimlar, ...tanitimKazanimlari].find((k) => k.kod === kod)!.id

export const tanitimSorulari: Soru[] = paket.sorular.map((s, i) => ({
  id: kimlik('70', i + 1),
  tur: s.tur as Soru['tur'],
  govde: s.govde,
  sekil_svg: s.sekil_svg,
  secenekler: s.secenekler as Soru['secenekler'],
  dogru_cevap: s.dogru_cevap,
  cozum_adimlari: s.cozum_adimlari.map((metin) => ({ metin })),
  zorluk: s.zorluk as Soru['zorluk'],
  baglam_temelli: s.baglam_temelli,
  kaynak_notu: null,
  ornek: false,
  kazanim_idleri: s.kazanimlar.map(kazanimId),
  beceri: s.beceri,
  kavram_yanilgisi: s.kavram_yanilgisi,
  puanlama_olcutu: s.puanlama_olcutu,
}))

export const tanitimIcerikleri: Icerik[] = paket.icerikler.map((c, i) => ({
  id: kimlik('71', i + 1),
  tur: c.tur as Icerik['tur'],
  baslik: c.baslik,
  aciklama: c.aciklama,
  unite_id: uniteBul(c.unite.seviye, c.unite.no).id,
  hafta: null,
  sira: c.sira,
  html_yolu: null,
  meb_baglanti: null,
  ornek: false,
  kazanim_idleri: c.kazanimlar.map(kazanimId),
  veri: c.veri as KonuVerisi,
}))

export const tanitimUniteYolu = () => {
  const u = tanitimUniteleri[0] ?? uniteBul('9', 3)
  return `/tahta/9/${u.id}`
}
