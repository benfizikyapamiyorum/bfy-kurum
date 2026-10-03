// Başlangıç kataloğu: ders, seviye, ünite ve TYMM kazanımları.
// Kazanım kodları ve metinleri MEB'in 2026-2027 1. dönem fizik konu-soru dağılım tablosundan
// alınmıştır (yalnızca kod ve metin; MEB içeriği kopyalanmaz). Diğer kazanımlar içe aktarımla eklenir.
// Bu dosya hem yerel deneme modunun verisidir hem de SQL tohum dosyasının kaynağıdır
// (npm run seed:uret). Kimlikler sabittir, iki tarafta aynı kalır.

import type { Ders, Kazanim, Katalog, Seviye, Unite } from '../alan/tipler'

const kimlik = (onEk: string, no: number) =>
  `${onEk}000000-0000-4000-8000-${String(no).padStart(12, '0')}`

export const FIZIK_ID = kimlik('10', 1)

const dersler: Ders[] = [{ id: FIZIK_ID, kod: 'FIZ', ad: 'Fizik', sira: 1 }]

const seviyeTanimlari: [string, string][] = [
  ['9', '9. sınıf'],
  ['10', '10. sınıf'],
  ['11', '11. sınıf'],
  ['12', '12. sınıf'],
  ['TYT', 'TYT'],
  ['AYT', 'AYT'],
]

const seviyeler: Seviye[] = seviyeTanimlari.map(([kod, ad], i) => ({
  id: kimlik('20', i + 1),
  kod,
  ad,
  sira: i + 1,
}))

export const seviyeId = (kod: string): string => {
  const s = seviyeler.find((x) => x.kod === kod)
  if (!s) throw new Error(`Bilinmeyen seviye: ${kod}`)
  return s.id
}

interface UniteTanimi {
  seviye: string
  no: number
  ad: string
  kazanimlar: [string, string][]
}

const uniteTanimlari: UniteTanimi[] = [
  {
    seviye: '9',
    no: 1,
    ad: 'Fizik Bilimi ve Kariyer Keşfi',
    kazanimlar: [
      ['FİZ.9.1.1', 'Fizik biliminin tanımına yönelik tümevarımsal akıl yürütebilme'],
      ['FİZ.9.1.2', 'Fizik biliminin alt dallarını sınıflandırabilme'],
      ['FİZ.9.1.3', 'Fizik bilimine katkıda bulunmuş bilim insanlarının deneyimlerini yansıtabilme'],
      [
        'FİZ.9.1.4',
        'Bilim ve teknoloji alanında faaliyet gösteren kurum veya kuruluşlarda fizik bilimi ile ilişkili kariyer olanaklarını sorgulayabilme',
      ],
    ],
  },
  {
    seviye: '9',
    no: 2,
    ad: 'Kuvvet ve Hareket',
    kazanimlar: [
      ['FİZ.9.2.1', 'Birimleri SI birim sisteminde verilen temel ve türetilmiş nicelikleri sınıflandırabilme'],
      ['FİZ.9.2.2', 'Skaler ve vektörel nicelikleri karşılaştırabilme'],
      [
        'FİZ.9.2.3',
        'Aynı doğrultu üzerinde yer alan farklı vektörlerin yön ve büyüklüklerine yönelik bilimsel çıkarım yapabilme',
      ],
      [
        'FİZ.9.2.4',
        'Vektörlerin toplanmasında kullanılan uç uca ekleme ve paralelkenar yöntemi ile bileşenlerine ayırma işlemine ilişkin tümevarımsal akıl yürütebilme',
      ],
      ['FİZ.9.2.5', 'Doğadaki temel kuvvetleri karşılaştırabilme'],
      ['FİZ.9.2.6', 'Hareketin temel kavramlarının tanımlarına yönelik tümevarımsal akıl yürütebilme'],
      ['FİZ.9.2.7', 'Hareket türlerini sınıflandırabilme'],
    ],
  },
  {
    seviye: '10',
    no: 1,
    ad: 'Kuvvet ve Hareket',
    kazanimlar: [
      ['FİZ.10.1.1', 'Yatay doğrultuda sabit hızlı hareket ile ilgili tümevarımsal akıl yürütebilme'],
      ['FİZ.10.1.2', 'İvme ve hız değişimi arasındaki ilişkiye yönelik tümevarımsal akıl yürütebilme'],
      [
        'FİZ.10.1.3',
        'Yatay doğrultuda sabit ivmeyle hareket eden cisimlerin hareket grafiklerinden elde edilen matematiksel modelleri yorumlayabilme',
      ],
    ],
  },
  {
    seviye: '10',
    no: 2,
    ad: 'Enerji',
    kazanimlar: [
      ['FİZ.10.2.1', 'Kuvvet-yer değiştirme grafiği kullanılarak iş ile ilgili tümevarımsal akıl yürütebilme'],
      ['FİZ.10.2.2', 'İş, enerji ve güç kavramlarına ilişkin çıkarım yapabilme'],
      ['FİZ.10.2.3', 'Enerji biçimlerini karşılaştırabilme'],
      ['FİZ.10.2.4', 'Mekanik enerjiyi çözümleyebilme'],
      ['FİZ.10.2.5', 'Yenilenebilen ve yenilenemeyen enerji kaynaklarını karşılaştırabilme'],
    ],
  },
  {
    seviye: '11',
    no: 1,
    ad: 'Kuvvet ve Hareket',
    kazanimlar: [
      ['FİZ.11.1.1', 'Serbest düşme hareketi yapan cisimlerin ivmesine yönelik tümevarımsal akıl yürütebilme'],
      ['FİZ.11.1.2', 'Serbest düşme hareketi ile ilgili kanıt kullanabilme'],
      ['FİZ.11.1.3', 'İki boyutta sabit ivmeli hareket ile ilgili tümevarımsal akıl yürütebilme'],
      ['FİZ.11.1.4', "Newton'ın Hareket Yasaları ile ilgili tümevarımsal akıl yürütebilme"],
      ['FİZ.11.1.5', "Newton'ın Hareket Yasalarını serbest cisim diyagramını kullanarak yorumlayabilme"],
      ['FİZ.11.1.6', 'Statik ve kinetik sürtünme kuvvetlerini karşılaştırabilme'],
      ['FİZ.11.1.7', 'Sürtünme kuvvetinin matematiksel modeline ilişkin tümevarımsal akıl yürütebilme'],
      ['FİZ.11.1.8', 'Limit hızı etkileyen değişkenler ile ilgili bilimsel çıkarım yapabilme'],
      [
        'FİZ.11.1.9',
        'Düzgün çembersel hareket yapan cisimlerin yörüngeleri ve hız vektörleri hakkında analojik akıl yürütebilme',
      ],
      [
        'FİZ.11.1.10',
        'Düzgün çembersel hareketin değişkenler arasındaki ilişkilerin matematiksel olarak modellemesine ilişkin tümevarımsal akıl yürütebilme',
      ],
    ],
  },
  {
    seviye: '11',
    no: 2,
    ad: 'Elektrik ve Manyetizma',
    kazanimlar: [
      [
        'FİZ.11.2.1',
        'Elektrik yükleri arasındaki elektriksel kuvvetin matematiksel modeline yönelik tümevarımsal akıl yürütebilme',
      ],
      ['FİZ.11.2.2', 'Elektriksel alanın matematiksel modeline yönelik tümevarımsal akıl yürütebilme'],
    ],
  },
]

const uniteler: Unite[] = []
const kazanimlar: Kazanim[] = []

uniteTanimlari.forEach((u, ui) => {
  const uniteId = kimlik('30', ui + 1)
  uniteler.push({ id: uniteId, ders_id: FIZIK_ID, seviye_id: seviyeId(u.seviye), no: u.no, ad: u.ad })
  u.kazanimlar.forEach(([kod, metin], ki) => {
    // FİZ.9.2.3 → 090203; FİZ.11.1.10 → 110110
    const [, sinif, unite, sira] = kod.split('.').map(Number) as [number, number, number, number]
    kazanimlar.push({
      id: kimlik('40', sinif * 10000 + unite * 100 + sira),
      unite_id: uniteId,
      kod,
      metin,
      sira: ki + 1,
    })
  })
})

export const katalog: Katalog = { dersler, seviyeler, uniteler, kazanimlar }

export const kazanimIdKoddan = (kod: string): string => {
  const k = kazanimlar.find((x) => x.kod === kod)
  if (!k) throw new Error(`Bilinmeyen kazanım kodu: ${kod}`)
  return k.id
}

export { kimlik as sabitKimlik }
