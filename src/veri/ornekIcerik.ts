// Örnek içerik: tek dosyalık bir HTML kitin tahtada nasıl açıldığını göstermek için.
// Kit public/ornek/ altında uygulamayla birlikte yayınlanır. Gerçek kitler içe aktarılır.

import type { Icerik } from '../alan/tipler'
import { kazanimIdKoddan, katalog, sabitKimlik, seviyeId } from './katalog'

const uniteId = (seviye: string, no: number) => {
  const u = katalog.uniteler.find((x) => x.seviye_id === seviyeId(seviye) && x.no === no)
  if (!u) throw new Error(`Ünite yok: ${seviye}/${no}`)
  return u.id
}

export const ornekIcerikler: Icerik[] = [
  {
    id: sabitKimlik('60', 1),
    tur: 'hafta_kiti',
    baslik: 'Örnek hafta kiti: Vektörler ve yer değiştirme',
    aciklama: 'Tek dosyalık HTML kitin tahtada nasıl açıldığını gösteren örnek.',
    unite_id: uniteId('9', 2),
    hafta: 1,
    sira: 1,
    html_yolu: '/ornek/ornek-hafta-kiti.html',
    meb_baglanti: null,
    ornek: true,
    kazanim_idleri: [kazanimIdKoddan('FİZ.9.2.2'), kazanimIdKoddan('FİZ.9.2.3')],
  },
]
