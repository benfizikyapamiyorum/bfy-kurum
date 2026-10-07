// Kaldırma kuvveti konu anlatımı: tahtada bölüm bölüm gösterilen kısa kavram başlıkları,
// şekiller ve 40/80 dakikalık ders akışı (soru numaraları sorular.ts ile aynı).

import { SU, Sekil, buyukluk, camKap, formul, kapOlculeri, kutu, masa, ok, yazi, ayakliDuzenek, dinamometre, ip, halka, silindir, ELIPS } from './cizim'

const Fk = '<i>F</i><sub>k</sub>'
const Vb = '<i>V</i><sub>b</sub>'
const ds = '<i>d</i><sub>s</sub>'
const dc = '<i>d</i><sub>c</sub>'
const G = '<i>G</i>'
const g = '<i>g</i>'

const KIRMIZI = '#c0392b'
const MAVI = '#1f5fae'
const YESIL = '#1e8449'

// Basınç kuvvetleri: üstte küçük aşağı, altta büyük yukarı, yanlarda eşit.
function k1(): string {
  const c = new Sekil('k1', 560, 340, 'Su içindeki küpün üst yüzeyine aşağı yönlü küçük, alt yüzeyine yukarı yönlü büyük, yan yüzeylerine eşit ve zıt basınç kuvvetleri etki ediyor; bileşke yukarı yönlü kaldırma kuvvetidir.')
  const masaY = 322
  const kap = { cx: 200, altY: masaY - 6, yukseklik: 250, r: 130, siviYuksekligi: 222 }
  const k = kapOlculeri(kap)
  const kupX = 160
  const kupY = k.siviY + 62
  const kenar = 80
  const icerik = kutu({ x: kupX, y: kupY, gen: kenar, boy: kenar, d: 26, renk: '#e3a33c' })
  c.ekle(masa(c, 20, 540, masaY))
  c.ekle(camKap(c, { ...kap, sivi: SU, ad: 'k', icerik }))
  const orta = kupX + kenar / 2
  c.ekle(
    ok(orta, kupY - 44, orta, kupY - 4, KIRMIZI, 3),
    ok(orta, kupY + kenar + 64, orta, kupY + kenar + 4, MAVI, 4.5),
    ok(kupX - 40, kupY + kenar / 2, kupX - 4, kupY + kenar / 2, '#6c7a89', 3),
    ok(kupX + kenar + 58, kupY + kenar / 2, kupX + kenar + 22, kupY + kenar / 2, '#6c7a89', 3),
    buyukluk(orta + 8, kupY - 26, 'F', 'üst', { renk: KIRMIZI }),
    buyukluk(orta + 8, kupY + kenar + 50, 'F', 'alt', { renk: MAVI }),
  )
  // sağda bileşke
  c.ekle(
    yazi(372, 120, 'Bileşke:', { boy: 14, kalin: true }),
    formul(372, 148, 'F_k = F_{alt} − F_{üst}', { boy: 16 }),
    ok(470, 260, 470, 170, YESIL, 5),
    buyukluk(482, 220, 'F', 'k', { boy: 16, renk: YESIL }),
    yazi(372, 290, 'Yan kuvvetler birbirini dengeler.', { boy: 12 }),
  )
  return c.svg()
}

// Arşimet: yüzen tahta blok, taşırma kabından taşan su.
function k2(): string {
  const c = new Sekil('k2', 560, 300, 'Ağzına kadar su dolu taşırma kabında yüzen tahta blok; taşan su yandaki kapta toplanmış. Taşan suyun ağırlığı kaldırma kuvvetine eşittir.')
  const masaY = 282
  const kap = { cx: 190, altY: masaY - 6, yukseklik: 160, r: 80, siviYuksekligi: 130 }
  const k = kapOlculeri(kap)
  const blok = kutu({ x: 150, y: k.siviY - 22, gen: 80, boy: 50, d: 22, renk: '#c89b6a' })
  c.ekle(masa(c, 20, 540, masaY))
  c.ekle(camKap(c, { ...kap, sivi: SU, ad: 'tas', icerik: blok }))
  const boruY = k.siviY + 2
  c.ekle(
    `<path d="M 268 ${boruY} L 318 ${boruY + 18}" stroke="#a8bcca" stroke-width="10" stroke-linecap="round"/>`,
    `<path d="M 268 ${boruY} L 318 ${boruY + 18}" stroke="#e9f1f6" stroke-width="6" stroke-linecap="round"/>`,
  )
  c.ekle(camKap(c, { cx: 360, altY: masaY - 6, yukseklik: 90, r: 42, sivi: SU, siviYuksekligi: 40, ad: 'toplama', olcekli: true }))
  c.ekle(
    yazi(418, 196, 'Taşan su:', { boy: 13, kalin: true }),
    formul(418, 218, 'hacmi = V_b', { boy: 14 }),
    formul(418, 240, 'ağırlığı = F_k', { boy: 14 }),
  )
  return c.svg()
}

// Yüzme, askıda kalma, batma.
function k4(): string {
  const c = new Sekil('k4', 640, 300, 'Üç kap: solda yüzen, ortada askıda kalan, sağda dibe batmış cisim; her birinde kaldırma kuvveti ve ağırlık okları.')
  const masaY = 280
  c.ekle(masa(c, 10, 630, masaY))
  const durum = (cx: number, ad: string, cisimY: (siviY: number, tabanY: number) => number, okFk: number, okG: number, etiket: string, esitlik: string, okN = 0) => {
    const kap = { cx, altY: masaY - 6, yukseklik: 170, r: 76, siviYuksekligi: 140 }
    const k = kapOlculeri(kap)
    const y = cisimY(k.siviY, k.tabanY)
    const cisim = kutu({ x: cx - 30, y, gen: 60, boy: 44, d: 18, renk: '#e3a33c' })
    c.ekle(camKap(c, { ...kap, sivi: SU, ad, icerik: cisim }))
    c.ekle(ok(cx - 8, y + 22, cx - 8, y + 22 - okFk, MAVI, 3.6), ok(cx + 8, y + 22, cx + 8, y + 22 + okG, KIRMIZI, 3.6))
    c.ekle(buyukluk(cx - 14, y + 16 - okFk, 'F', 'k', { renk: MAVI, hiza: 'end' }), yazi(cx + 16, y + 26 + okG, 'G', { renk: KIRMIZI, italik: true, kalin: true }))
    if (okN) c.ekle(ok(cx - 24, y + 22, cx - 24, y + 22 - okN, YESIL, 3.6), yazi(cx - 30, y + 30, 'N', { renk: YESIL, italik: true, kalin: true, hiza: 'end' }))
    c.ekle(yazi(cx, 28, etiket, { boy: 15, kalin: true, hiza: 'middle' }), formul(cx, 50, esitlik, { boy: 14, hiza: 'middle' }))
  }
  durum(110, 'yuz', (siviY) => siviY - 20, 32, 32, 'Yüzme', 'F_k = G,  d_c < d_s')
  durum(320, 'ask', (siviY) => siviY + 46, 40, 40, 'Askıda kalma', 'F_k = G,  d_c = d_s')
  durum(530, 'bat', (_s, tabanY) => tabanY - 50, 22, 40, 'Batma', 'F_k < G,  d_c > d_s', 18)
  return c.svg()
}

// Dinamometre: ip gerilmesi + kaldırma kuvveti = ağırlık.
function k5(): string {
  const c = new Sekil('k5', 560, 360, 'Dinamometreye asılı silindir su içinde dengede; silindire yukarı yönde ip gerilmesi ve kaldırma kuvveti, aşağı yönde ağırlığı etki ediyor.')
  const masaY = 340
  const kap = { cx: 300, altY: masaY - 6, yukseklik: 130, r: 66, siviYuksekligi: 106 }
  const k = kapOlculeri(kap)
  const silUst = k.siviY + 26
  const d = ayakliDuzenek(c, { cubukX: 130, masaY, ustY: 10, kolUcX: 300 })
  const dm = dinamometre(c, { x: 300, ustY: d.asmaY - 2, boy: 112, okuma: 3, maks: 10, okumaYazisi: 'T' })
  const h = halka(294, silUst - 9)
  c.ekle(masa(c, 20, 540, masaY), d.svg)
  c.ekle(camKap(c, { ...kap, sivi: SU, ad: 'k', icerik: silindir(c, { cx: 294, ustY: silUst, boy: 46, r: 20, renk: '#b87333', ad: 'sil' }) + h.svg }))
  c.ekle(ip(dm.kancaX, dm.kancaY, h.x, h.y), dm.svg)
  const cx = 294
  const oy = silUst + 23 + 20 * ELIPS
  c.ekle(
    ok(cx + 10, silUst + 4, cx + 10, silUst - 34, '#7d3c98', 3.2),
    ok(cx - 10, oy, cx - 10, oy - 18, MAVI, 3.2),
    ok(cx, oy, cx, oy + 56, KIRMIZI, 3.2),
    formul(cx + 18, silUst - 22, 'T', { renk: '#7d3c98', kalin: true }),
    formul(cx - 18, oy - 8, 'F_k', { renk: MAVI, hiza: 'end' }),
    formul(cx + 10, oy + 56, 'G', { renk: KIRMIZI, kalin: true }),
    formul(400, 120, 'T + F_k = G', { boy: 18 }),
    yazi(400, 144, 'Dinamometre T’yi gösterir.', { boy: 12 }),
  )
  return c.svg()
}

export const KONU = {
  baslik: 'Kaldırma kuvveti',
  aciklama: 'Şekilli kavram başlıkları ve 40 ya da 80 dakikalık ders akışı.',
  bolumler: [
    {
      baslik: 'Kaldırma kuvveti nedir?',
      metin: `Sıvılar, içlerine kısmen ya da tamamen batmış cisimlere yukarı yönlü bir kuvvet uygular: kaldırma kuvveti (${Fk}). Durgun sıvıda basınç derinlikle artar. Cismin alt yüzeyi daha derinde olduğu için alt yüzeye etki eden kuvvet üst yüzeydekinden büyüktür; aradaki fark kaldırma kuvvetidir.`,
      sekil_svg: k1(),
    },
    {
      baslik: 'Batan hacim ve Arşimet ilkesi',
      metin: `Batan hacim (${Vb}), cismin sıvı içinde kalan kısmının hacmidir; her zaman cismin tüm hacmi değildir. Kaldırma kuvveti, cismin yerini değiştirdiği sıvının ağırlığına eşittir: ${Fk} = ${Vb} × ${ds} × ${g}.`,
      sekil_svg: k2(),
    },
    {
      baslik: 'Hangi nicelikler önemlidir?',
      metin: `Kaldırma kuvveti batan hacme, sıvının yoğunluğuna ve çekim ivmesine bağlıdır. Cismin ağırlığına, malzemesine ve hacmi değişmiyorsa bulunduğu derinliğe bağlı değildir. Bir değişkenin etkisini görmek için deneyde yalnız o değişken değiştirilir.`,
      sekil_svg: null,
    },
    {
      baslik: 'Yüzme, askıda kalma ve batma',
      metin: `Yüzen ve askıda kalan cisimde ${Fk} = ${G}. Cismin yoğunluğu (${dc}) sıvınınkinden (${ds}) küçükse cisim yüzer, eşitse askıda kalır, büyükse batar. Batan cisimde ${Fk} &lt; ${G}; aradaki farkı kabın tabanı karşılar.`,
      sekil_svg: k4(),
    },
    {
      baslik: 'Dinamometre ve görünür ağırlık',
      metin: `Sıvı içinde dinamometreye asılı cisim dengedeyken ip gerilmesi (<i>T</i>) ile kaldırma kuvvetinin toplamı ağırlığa eşittir: <i>T</i> + ${Fk} = ${G}. Dinamometre <i>T</i>’yi gösterir. Havadaki ve sıvıdaki okumaların farkı kaldırma kuvvetidir; cismin ağırlığı değişmez.`,
      sekil_svg: k5(),
    },
    {
      baslik: 'Soruyu çözerken üç kontrol',
      metin: 'Birincisi: cisim yüzüyor mu, askıda mı, tamamen batmış mı? İkincisi: batan hacim, sıvının yoğunluğu ya da çekim ivmesi değişiyor mu? Üçüncüsü: ip ya da kabın tabanı gibi başka bir kuvvet var mı?',
      sekil_svg: null,
    },
  ],
  // Sorular tahtada kazanıma göre gruplanıp numaralanır; bu yüzden numarayla değil, bağlamıyla anılır.
  planlar: {
    '40': [
      { time: '0-5 dk', title: 'Ön kontrol', body: 'Batık gemiden çıkan tartı ağırlığı ve Ay üssü sorularıyla ağırlık, kaldırma kuvveti ve dinamometre okuması ayrımını yoklayın.' },
      { time: '5-12 dk', title: 'Bir kavramı netleştir', body: 'Su altı aracının sensör gövdesi sorusuyla kaldırma kuvvetinin, alt ve üst yüzeydeki basınç kuvvetlerinin farkı olduğunu gösterin.' },
      { time: '12-28 dk', title: 'Karşılaştırmalı çözüm', body: 'Pekmez ve şamandıra sorularıyla yüzen bir cisimde sıvı ya da yük değişince hangi niceliğin değiştiğini karşılaştırın.' },
      { time: '28-36 dk', title: 'Bireysel kontrol', body: 'Taşan şurup ve grafik sorularını cevabı göstermeden çözdürün.' },
      { time: '36-40 dk', title: 'Hedefli ödev', body: 'Yanlışın kaynağına göre yük gemisi, model denizaltı, dalgıç ya da eriyen buz sorusunu ödev verin.' },
    ],
    '80': [
      { time: '0-10 dk', title: 'Ön kontrol ve gerekçe', body: 'Batık gemiden çıkan tartı ağırlığı ve Ay üssü sorularını bireysel çözdürün; cevabı ve gerekçeyi ayrı okuyun.' },
      { time: '10-25 dk', title: 'Basınçtan kuvvete', body: 'Sensör gövdesi ve şamandıra sorularıyla basınç ile basınç kuvveti ayrımını ve kaldırma kuvvetinin kaynağını açıklayın.' },
      { time: '25-40 dk', title: 'Deney tasarımı', body: 'Deney tablosu sorusunda her iddia için hangi değişkenin sabit tutulduğunu sınıfça belirleyin.' },
      { time: '40-60 dk', title: 'Bireysel mini test', body: 'Yük gemisi, taşan şurup, pekmez, model denizaltı ve grafik sorularını bireysel çözdürün.' },
      { time: '60-80 dk', title: 'Sınırları tartış', body: 'Dalgıç ve eriyen buz sorularıyla kuralların hangi koşulda geçerli olduğunu tartışın; yanlışın kaynağına göre telafi seçin.' },
    ],
  },
}
