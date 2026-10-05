// Kaldırma kuvveti paketini üretir: soruları doğrular, şekilleri çizer, içe aktarım dosyasını yazar.
// Kullanım: npx tsx icerik-paketleri/kaldirma-kuvveti/paket.ts
// Çıktı: icerik-paketleri/kaldirma-kuvveti.json  (Süper admin > Toplu içe aktarım ile yüklenir)

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { iceAktarimDogrula, type IceAktarimDosyasi } from '../../src/alan/iceAktarim'
import { katalog } from '../../src/veri/katalog'
import { KONU } from './konu'
import { dogrula, iceAktarimSorulari } from './sorular'

const hatalar = dogrula()
if (hatalar.length) {
  console.error('Doğrulama hataları:\n' + hatalar.join('\n'))
  process.exit(1)
}

const dosya: IceAktarimDosyasi = {
  surum: 1,
  kaynak: 'Ben Fizik Yapamıyorum: kaldırma kuvveti paketi (9. sınıf, Akışkanlar).',
  katalog: {
    uniteler: [{ ders: 'FIZ', seviye: '9', no: 3, ad: 'Akışkanlar' }],
    kazanimlar: [
      { kod: 'FİZ.9.3.5', metin: 'Kaldırma kuvvetini etkileyen değişkenleri belirlemeye yönelik deney yapabilme', unite: { seviye: '9', no: 3 }, sira: 5 },
      { kod: 'FİZ.9.3.6', metin: 'Kaldırma kuvveti ile sıvılardaki basınca neden olan kuvvet arasındaki ilişkiye yönelik çıkarım yapabilme', unite: { seviye: '9', no: 3 }, sira: 6 },
    ],
  },
  sorular: iceAktarimSorulari(),
  icerikler: [
    {
      dis_kimlik: 'fizik-atolye/kaldirma-kuvveti/konu',
      tur: 'konu_anlatimi',
      baslik: `${KONU.baslik}: kavram rehberi`,
      aciklama: KONU.aciklama,
      unite: { seviye: '9', no: 3 },
      sira: 1,
      kazanimlar: ['FİZ.9.3.5', 'FİZ.9.3.6'],
      veri: { bolumler: KONU.bolumler, planlar: KONU.planlar },
      ornek: false,
      yayinda: true,
    },
  ],
}

const sonuc = iceAktarimDogrula(dosya, new Set(katalog.kazanimlar.map((k) => k.kod)))
if (!sonuc.gecerli) {
  console.error(sonuc.hatalar.join('\n'))
  process.exit(1)
}
const yol = resolve(import.meta.dirname, '../kaldirma-kuvveti.json')
writeFileSync(yol, JSON.stringify(dosya, null, 2) + '\n')
console.log(`Hazır: ${dosya.sorular!.length} soru, 1 konu anlatımı. Doğrulama: ${hatalar.length} hata.`, sonuc.uyarilar.join('\n'))
