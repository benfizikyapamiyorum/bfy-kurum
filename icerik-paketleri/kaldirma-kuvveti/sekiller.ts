// Kaldırma kuvveti sorularının şekilleri. Her fonksiyon tek bir <svg> döndürür.
// Sayılar soru metniyle aynıdır; değişirse sorular.ts içindeki doğrulama da değişmeli.

import {
  ELIPS,
  PEKMEZ,
  SU,
  Sekil,
  TUZLU_SU,
  ayakliDuzenek,
  buyukluk,
  camKap,
  camTank,
  dinamometre,
  golge,
  halka,
  ip,
  kapOlculeri,
  kutu,
  masa,
  ok,
  olcuDikey,
  panelBasligi,
  silindir,
  ton,
  yazi,
  type Sivi,
} from './cizim'

const s = (n: number) => String(Math.round(n * 10) / 10)

// ---------------------------------------------------------------------------
// Ortak sahne parçaları
// ---------------------------------------------------------------------------

const GOL: Sivi = { ad: 'gol', ust: '#9fd0ec', alt: '#2f6f9e', yuzey: '#c6e6f7', opaklik: 0.9 }
const NEHIR: Sivi = { ad: 'nehir', ust: '#a9c7a1', alt: '#55735a', yuzey: '#c9dcc2', opaklik: 0.92 }
const DENIZ: Sivi = { ad: 'deniz', ust: '#8cc8ea', alt: '#1f5f92', yuzey: '#bfe2f5', opaklik: 0.92 }

/** Açık su kesiti: gökyüzü bandı, dalgalı yüzey çizgisi, derinlikle koyulaşan su. */
function suKesiti(c: Sekil, o: { x: number; y: number; gen: number; derinlik: number; yuzeyY: number; sivi: Sivi }) {
  const { x, gen, yuzeyY, sivi } = o
  const gok = c.dikey('gok', '#eef6fb', '#ffffff')
  const su = c.dikey(`kesit-${sivi.ad}`, sivi.ust, sivi.alt, 1)
  let dalga = `M ${s(x)} ${s(yuzeyY)}`
  for (let xx = x; xx < x + gen; xx += 24) dalga += ` q 6 -3 12 0 t 12 0`
  return (
    `<rect x="${s(x)}" y="${s(o.y)}" width="${s(gen)}" height="${s(yuzeyY - o.y)}" fill="${gok}"/>` +
    `<rect x="${s(x)}" y="${s(yuzeyY)}" width="${s(gen)}" height="${s(o.derinlik)}" fill="${su}"/>` +
    `<path d="${dalga}" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-opacity="0.9"/>`
  )
}

/** Bir çerçeve: panelleri ayırmak için ince kenarlı yuvarlak dikdörtgen. */
function cerceve(x: number, y: number, gen: number, boy: number) {
  return `<rect x="${s(x)}" y="${s(y)}" width="${s(gen)}" height="${s(boy)}" rx="10" fill="none" stroke="#c9d3dc" stroke-width="1.2"/>`
}

/**
 * Ayaklı düzenek + dinamometre. Kol yüksekliği (kolY) şekle göre seçilir; kancanın ucu döner,
 * ip oradan cisme iner. Kancanın kabın ağzının üstünde kalması çağıranın sorumluluğu.
 */
function asiliDuzenek(
  c: Sekil,
  o: { cubukX: number; kolUcX: number; masaY: number; kolY: number; okuma: number; maks: number; okumaYazisi: string; dinamoBoy?: number },
) {
  const d = ayakliDuzenek(c, { cubukX: o.cubukX, masaY: o.masaY, ustY: o.kolY - 16, kolUcX: o.kolUcX })
  const dm = dinamometre(c, { x: o.kolUcX, ustY: d.asmaY - 2, boy: o.dinamoBoy ?? 118, okuma: o.okuma, maks: o.maks, okumaYazisi: o.okumaYazisi })
  return { duzenek: d.svg, dinamo: dm.svg, kancaX: dm.kancaX, kancaY: dm.kancaY }
}

/** Ağırlık (antik tartı ağırlığı): basık silindir gövde, üstte topuz. Topuzun tepesi ustY. */
function tartiAgirligi(c: Sekil, cx: number, ustY: number, ad: string) {
  const govdeUst = ustY + 12
  const h = halka(cx, ustY - 8)
  return {
    svg:
      silindir(c, { cx, ustY: govdeUst, boy: 34, r: 24, renk: '#5e625f', ad: `${ad}-govde` }) +
      `<ellipse cx="${s(cx)}" cy="${s(govdeUst + 1)}" rx="11" ry="${s(11 * ELIPS)}" fill="${ton('#5e625f', -0.2)}"/>` +
      silindir(c, { cx, ustY: ustY + 2, boy: 10, r: 7, renk: '#696d69', ad: `${ad}-topuz` }) +
      h.svg,
    ipX: h.x,
    ipY: h.y,
  }
}

// ---------------------------------------------------------------------------
// S1: Su altı aracının sensör gövdesi (basınç kuvvetleri)
// ---------------------------------------------------------------------------

export function s1(): string {
  const c = new Sekil('s1', 640, 340, 'Bir göl kesitinde, destek teknesinden kabloyla sarkıtılan küp biçimli sensör gövdesi iki farklı derinlikte; üst ve alt yüzeylerinde basınç sensörleri var.')
  const panel = (x0: number, baslik: string, ustDerinlik: number) => {
    const yuzeyY = 78
    const metre = 92 // 1 m = 92 piksel (yalnızca bu şekilde)
    const kenar = 0.2 * metre
    const kupUstY = yuzeyY + ustDerinlik * metre
    const cx = x0 + 190
    let p = suKesiti(c, { x: x0, y: 30, gen: 300, derinlik: 300 - 78 + 10, yuzeyY, sivi: GOL })
    // destek teknesi (solda) ve kıç tarafındaki vinç; kol teknenin dışına uzanır
    const t0 = x0 + 30
    p +=
      `<path d="M ${s(t0)} ${s(yuzeyY - 20)} L ${s(t0 + 120)} ${s(yuzeyY - 20)} L ${s(t0 + 108)} ${s(yuzeyY + 9)} L ${s(t0 + 14)} ${s(yuzeyY + 9)} Z" fill="${c.dikey('tekne', '#f4f6f8', '#b9c3cc')}" stroke="#7d8a96" stroke-width="1"/>` +
      `<rect x="${s(t0 + 18)}" y="${s(yuzeyY - 38)}" width="44" height="18" rx="3" fill="#e8ecef" stroke="#7d8a96" stroke-width="1"/>` +
      `<rect x="${s(t0 + 22)}" y="${s(yuzeyY - 33)}" width="36" height="6" rx="1" fill="#34495e"/>` +
      `<path d="M ${s(t0 + 104)} ${s(yuzeyY - 20)} L ${s(t0 + 104)} ${s(yuzeyY - 52)} L ${s(cx)} ${s(yuzeyY - 52)}" fill="none" stroke="#4b5560" stroke-width="3.4" stroke-linejoin="round"/>` +
      `<circle cx="${s(cx)}" cy="${s(yuzeyY - 50)}" r="3.5" fill="#4b5560"/>`
    // kablo: vinç kolunun ucundan iner
    p += `<line x1="${s(cx)}" y1="${s(yuzeyY - 47)}" x2="${s(cx)}" y2="${s(kupUstY - 6)}" stroke="#2c2622" stroke-width="1.6"/>`
    // küp (eğik bakış) ve sensörler
    p += kutu({ x: cx - kenar / 2, y: kupUstY, gen: kenar, boy: kenar, d: 8, renk: '#f2b632' })
    p += `<rect x="${s(cx - 4)}" y="${s(kupUstY - 6)}" width="8" height="5" rx="1" fill="#2b3640"/>`
    p += `<rect x="${s(cx - 4)}" y="${s(kupUstY + kenar)}" width="8" height="5" rx="1" fill="#2b3640"/>`
    // derinlik ölçüleri (yüzeyden üst yüzeye)
    p += olcuDikey(cx - 32, yuzeyY, kupUstY, `${ustDerinlik.toFixed(1).replace('.', ',')} m`, 'sol')
    p += yazi(cx + 30, kupUstY + 4, 'üst sensör', { boy: 11 })
    p += yazi(cx + 30, kupUstY + kenar + 8, 'alt sensör', { boy: 11 })
    p += panelBasligi(x0 + 150, 22, baslik)
    return p
  }
  c.ekle(panel(10, 'Konum I', 0.5), panel(330, 'Konum II', 2.0))
  return c.svg()
}

// ---------------------------------------------------------------------------
// S2: Yük gemisi nehirden denize
// ---------------------------------------------------------------------------

function gemi(c: Sekil, x: number, suY: number, batma: number, isaretY: number) {
  // gövde: su çizgisinin batma piksel altına kadar
  const omurga = suY + batma
  const ust = omurga - 66
  const govdeUst = c.dikey('gemi-ust', '#2f3a44', '#1c242c')
  const antifouling = c.dikey('gemi-alt', '#b8432f', '#7a2416')
  const pr = (pts: number[][]) => pts.map(([a, b]) => `${s(a!)},${s(b!)}`).join(' ')
  const sol = x
  const sag = x + 250
  let p =
    // alt boya (kırmızı), üst boya (koyu)
    `<polygon points="${pr([[sol + 6, ust + 40], [sag - 4, ust + 40], [sag - 26, omurga], [sol + 30, omurga]])}" fill="${antifouling}"/>` +
    `<polygon points="${pr([[sol, ust], [sag + 12, ust - 6], [sag - 4, ust + 40], [sol + 6, ust + 40]])}" fill="${govdeUst}"/>` +
    `<line x1="${s(sol)}" y1="${s(ust)}" x2="${s(sag + 12)}" y2="${s(ust - 6)}" stroke="#ffffff" stroke-width="1.4" stroke-opacity="0.6"/>`
  // konteynerler
  const renkler = ['#c0392b', '#2471a3', '#d4ac0d', '#1e8449', '#7d3c98', '#ca6f1e']
  for (let i = 0; i < 6; i++) {
    for (let k = 0; k < 2; k++) {
      p += kutu({ x: sol + 50 + i * 27, y: ust - 18 - k * 15, gen: 25, boy: 14, d: 8, renk: renkler[(i + k * 2) % 6]! })
    }
  }
  // köprü üstü
  p += kutu({ x: sol + 10, y: ust - 46, gen: 32, boy: 46, d: 10, renk: '#eef1f4' })
  p += `<rect x="${s(sol + 14)}" y="${s(ust - 40)}" width="24" height="5" fill="#2c3e50"/>`
  // su çizgisi işareti (gövde üstünde, kırmızı-beyaz)
  p +=
    `<line x1="${s(sag - 70)}" y1="${s(isaretY)}" x2="${s(sag - 38)}" y2="${s(isaretY)}" stroke="#ffffff" stroke-width="2.6"/>` +
    `<circle cx="${s(sag - 54)}" cy="${s(isaretY)}" r="7" fill="none" stroke="#ffffff" stroke-width="1.8"/>`
  return p
}

export function s2(): string {
  const c = new Sekil('s2', 640, 300, 'Aynı yük gemisi solda nehirde, sağda denizde yüzüyor; gövdedeki su çizgisi işareti nehirde su yüzeyinde, denizde su yüzeyinin biraz üstünde.')
  const panel = (x0: number, baslik: string, sivi: Sivi, batma: number) => {
    const suY = 190
    let p = suKesiti(c, { x: x0, y: 40, gen: 300, derinlik: 90, yuzeyY: suY, sivi })
    // Nehirde işaret tam su çizgisinde; denizde gemi yükselir, işaret aradaki fark kadar yukarıda kalır.
    const isaret = suY - (52 - batma)
    p += gemi(c, x0 + 22, suY, batma, isaret)
    // suyun gövdeyi kapattığı kısım: yarı saydam şerit
    p += `<rect x="${s(x0)}" y="${s(suY)}" width="300" height="90" fill="${sivi.alt}" fill-opacity="0.38"/>`
    p += `<line x1="${s(x0)}" y1="${s(suY)}" x2="${s(x0 + 300)}" y2="${s(suY)}" stroke="#ffffff" stroke-width="1.4" stroke-opacity="0.9"/>`
    p += panelBasligi(x0 + 150, 28, baslik)
    p += cerceve(x0, 40, 300, 250)
    return p
  }
  c.ekle(panel(10, 'Nehirde (tatlı su)', NEHIR, 52), panel(330, 'Denizde, yük almadan önce', DENIZ, 40))
  return c.svg()
}

// ---------------------------------------------------------------------------
// S3: Deney düzeneği (beş numaralı deneme: X cismi suya yarıya kadar batırılmış)
// ---------------------------------------------------------------------------

export function s3(): string {
  const c = new Sekil('s3', 520, 380, 'Ayaklı düzeneğe asılı dinamometrenin ucundaki silindir biçimli X cismi, su dolu ölçekli kaba yarısına kadar batırılmış.')
  const masaY = 352
  const kap = { cx: 330, altY: masaY - 6, yukseklik: 120, r: 60, siviYuksekligi: 74 }
  const k = kapOlculeri(kap)
  const cisimBoy = 56
  const cisimUst = k.siviY - cisimBoy / 2
  const a = asiliDuzenek(c, { cubukX: 150, kolUcX: 330, masaY, kolY: 28, okuma: 2.2, maks: 10, okumaYazisi: '2,2 N' })
  const h = halka(330 - 6, cisimUst - 9)
  const govde = silindir(c, { cx: 324, ustY: cisimUst, boy: cisimBoy, r: 20, renk: '#c8ccd1', ad: 'x' })
  c.ekle(masa(c, 20, 500, masaY), a.duzenek)
  c.ekle(camKap(c, { ...kap, sivi: SU, ad: 'k', olcekli: true, icerik: govde + h.svg }))
  c.ekle(ip(a.kancaX, a.kancaY, h.x, h.y), a.dinamo)
  c.ekle(yazi(354, cisimUst + 18, 'X', { boy: 14, kalin: true }))
  return c.svg()
}

// ---------------------------------------------------------------------------
// S4: Taşırma kabı, taşan şurup, dinamometre
// ---------------------------------------------------------------------------

export function s4(): string {
  const c = new Sekil('s4', 600, 410, 'Dinamometreye asılı bir taş, ağzına kadar şurup dolu taşırma kabına tamamen daldırılmış; taşan şurup yandaki ölçekli kapta toplanmış.')
  const masaY = 360
  const SURUP: Sivi = { ad: 'surup', ust: '#f0b04a', alt: '#a2510f', yuzey: '#f6c977', opaklik: 0.72 }
  const kap = { cx: 270, altY: masaY - 6, yukseklik: 150, r: 66, siviYuksekligi: 128 }
  const k = kapOlculeri(kap)
  const tasUst = k.siviY + 30
  const a = asiliDuzenek(c, { cubukX: 100, kolUcX: 270, masaY, kolY: 22, okuma: 4.2, maks: 10, okumaYazisi: '4,2 N', dinamoBoy: 108 })
  // taş: düzensiz çokgen
  const tasDolgu = c.radyal('tas', '#b7b3ac', '#55514c', 0.3, 0.25)
  const tas =
    `<path d="M 238 ${s(tasUst + 16)} C 240 ${s(tasUst + 4)}, 252 ${s(tasUst)}, 266 ${s(tasUst + 1)} C 282 ${s(tasUst + 2)}, 298 ${s(tasUst + 10)}, 301 ${s(tasUst + 24)} C 304 ${s(tasUst + 38)}, 292 ${s(tasUst + 52)}, 272 ${s(tasUst + 55)} C 254 ${s(tasUst + 57)}, 238 ${s(tasUst + 48)}, 235 ${s(tasUst + 34)} C 233 ${s(tasUst + 26)}, 236 ${s(tasUst + 20)}, 238 ${s(tasUst + 16)} Z" fill="${tasDolgu}" stroke="#4a4642" stroke-width="0.8"/>` +
    `<path d="M 250 ${s(tasUst + 12)} C 258 ${s(tasUst + 6)}, 272 ${s(tasUst + 6)}, 280 ${s(tasUst + 12)}" fill="none" stroke="#d8d4cd" stroke-width="1.6" stroke-opacity="0.7" stroke-linecap="round"/>` +
    `<path d="M 262 ${s(tasUst + 30)} l 10 6 l 12 -3" fill="none" stroke="#3f3b37" stroke-width="0.9" stroke-opacity="0.6"/>`
  const h = halka(264, tasUst - 8)
  // taşırma borusu: kabın sağ kenarında, sıvı yüzeyi hizasında
  const boruY = k.siviY + 2
  const boru =
    `<path d="M ${s(334)} ${s(boruY)} L ${s(378)} ${s(boruY + 18)}" stroke="#a8bcca" stroke-width="10" stroke-linecap="round"/>` +
    `<path d="M ${s(334)} ${s(boruY)} L ${s(378)} ${s(boruY + 18)}" stroke="#e9f1f6" stroke-width="6" stroke-linecap="round"/>` +
    // akan şurup ipliği
    `<path d="M ${s(380)} ${s(boruY + 20)} q 4 30 2 70" stroke="#c9741f" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
  const toplama = { cx: 410, altY: masaY - 6, yukseklik: 96, r: 40, siviYuksekligi: 44 }
  c.ekle(masa(c, 20, 580, masaY), a.duzenek)
  c.ekle(camKap(c, { ...kap, sivi: SURUP, ad: 'tasirma', icerik: tas + h.svg }))
  c.ekle(boru)
  c.ekle(camKap(c, { ...toplama, sivi: SURUP, ad: 'toplama', olcekli: true }))
  c.ekle(ip(a.kancaX, a.kancaY, h.x, h.y), a.dinamo)
  c.ekle(yazi(410, masaY + 30, 'taşan şurup: 150 cm³', { boy: 12, hiza: 'middle' }))
  c.ekle(yazi(270, masaY + 30, 'taşırma kabı', { boy: 12, hiza: 'middle' }))
  return c.svg()
}

// ---------------------------------------------------------------------------
// S5: Areometre (su ve sulandırılmış pekmez)
// ---------------------------------------------------------------------------

function areometre(c: Sekil, cx: number, siviY: number, batan: number, ad: string) {
  // batan: sıvı yüzeyinin altında kalan gövde uzunluğu (piksel). Hazne + gövde toplam boy sabit.
  const toplam = 190
  const altY = siviY + batan
  const ustY = altY - toplam
  const cam = c.yatay(`aero-${ad}`, '#eef4f8', 0.9)
  let p =
    // hazne
    `<path d="M ${s(cx - 10)} ${s(altY - 44)} C ${s(cx - 11)} ${s(altY - 14)}, ${s(cx - 6)} ${s(altY)}, ${s(cx)} ${s(altY)} C ${s(cx + 6)} ${s(altY)}, ${s(cx + 11)} ${s(altY - 14)}, ${s(cx + 10)} ${s(altY - 44)} C ${s(cx + 9)} ${s(altY - 50)}, ${s(cx + 5)} ${s(altY - 54)}, ${s(cx + 4)} ${s(altY - 58)} L ${s(cx - 4)} ${s(altY - 58)} C ${s(cx - 5)} ${s(altY - 54)}, ${s(cx - 9)} ${s(altY - 50)}, ${s(cx - 10)} ${s(altY - 44)} Z" fill="${cam}" stroke="#8ba3b4" stroke-width="1"/>` +
    // haznedeki saçma bilyeler
    `<path d="M ${s(cx - 7)} ${s(altY - 12)} Q ${s(cx)} ${s(altY - 17)} ${s(cx + 7)} ${s(altY - 12)} Q ${s(cx + 5)} ${s(altY - 3)} ${s(cx)} ${s(altY - 3)} Q ${s(cx - 5)} ${s(altY - 3)} ${s(cx - 7)} ${s(altY - 12)} Z" fill="${c.radyal(`sacma-${ad}`, '#9aa1a8', '#3c4248')}"/>` +
    // ince gövde
    `<rect x="${s(cx - 4)}" y="${s(ustY)}" width="8" height="${s(toplam - 58)}" rx="3" fill="${cam}" stroke="#8ba3b4" stroke-width="1"/>`
  for (let i = 0; i <= 10; i++) {
    const yy = ustY + 8 + i * 9.6
    p += `<line x1="${s(cx - 3)}" y1="${s(yy)}" x2="${s(cx + (i % 5 ? 0 : 3))}" y2="${s(yy)}" stroke="#c0392b" stroke-width="0.8"/>`
  }
  return p
}

export function s5(): string {
  const c = new Sekil('s5', 520, 330, 'İki uzun ölçekli kapta aynı areometre yüzüyor: solda su, sağda sulandırılmış pekmez.')
  const masaY = 290
  const kap = (cx: number, sivi: Sivi, ad: string, batan: number, etiket: string) => {
    const o = { cx, altY: masaY - 6, yukseklik: 210, r: 34, siviYuksekligi: 160 }
    const k = kapOlculeri(o)
    return (
      camKap(c, { ...o, sivi, ad, icerik: areometre(c, cx, k.siviY, batan, ad) }) +
      yazi(cx, masaY + 32, etiket, { boy: 13, hiza: 'middle', kalin: true })
    )
  }
  c.ekle(masa(c, 20, 500, masaY))
  // 1 cm = 3 piksel; suda 60 cm³ → gövde alanı 1 cm² ölçeğinde batma farkı 12 cm = 36 piksel
  c.ekle(kap(160, SU, 'su', 150, 'Su'))
  c.ekle(kap(360, { ...PEKMEZ, opaklik: 0.8 }, 'pekmez', 150 - 36, 'Sulandırılmış pekmez'))
  return c.svg()
}

// ---------------------------------------------------------------------------
// S6: Antik tartı ağırlığı: havada ve suda
// ---------------------------------------------------------------------------

export function s6(): string {
  const c = new Sekil('s6', 640, 400, 'Batıktan çıkarılan içi dolu antik bir tartı ağırlığı; I. düzenekte havada, II. düzenekte su dolu kabın içinde dinamometreye asılı.')
  const masaY = 372
  const panel = (x0: number, baslik: string, suda: boolean, okuma: number, okumaYazisi: string) => {
    const kapCx = x0 + 200
    const kap = { cx: kapCx, altY: masaY - 6, yukseklik: 124, r: 62, siviYuksekligi: 98 }
    const k = kapOlculeri(kap)
    const agirlikUst = suda ? k.siviY + 26 : 246
    const a = asiliDuzenek(c, { cubukX: x0 + 60, kolUcX: kapCx, masaY, kolY: 36, okuma, maks: 10, okumaYazisi })
    const t = tartiAgirligi(c, kapCx - 6, agirlikUst, `t${x0}`)
    let p = a.duzenek
    if (suda) p += camKap(c, { ...kap, sivi: SU, ad: `k${x0}`, icerik: t.svg })
    else p += t.svg
    p += ip(a.kancaX, a.kancaY, t.ipX, t.ipY) + a.dinamo
    p += panelBasligi(x0 + 150, 26, baslik)
    return p
  }
  c.ekle(masa(c, 14, 626, masaY))
  c.ekle(panel(10, 'I. Havada', false, 8.8, '8,8 N'))
  c.ekle(panel(330, 'II. Suda', true, 7.8, '7,8 N'))
  c.ekle(`<line x1="320" y1="40" x2="320" y2="${masaY - 34}" stroke="#d3dbe2" stroke-width="1" stroke-dasharray="4 4"/>`)
  return c.svg()
}

// ---------------------------------------------------------------------------
// S7: Silindir şamandıra ve dip sensörü
// ---------------------------------------------------------------------------

export function s7(): string {
  const c = new Sekil('s7', 600, 320, 'Gölde dik yüzen, kırmızı beyaz şeritli silindir biçimli bir şamandıra; alt yüzeyinde basınç sensörü var. Kıyıdan uzanan iskelede şamandıraya takılacak 50 kg kütleli güneş enerjili lamba duruyor.')
  const yuzeyY = 150
  const cx = 230
  const r = 40
  const boy = 120
  const batma = 60 // 1 cm = 1 piksel
  const ustY = yuzeyY + batma - boy
  const ry = r * ELIPS
  c.ekle(suKesiti(c, { x: 10, y: 20, gen: 580, derinlik: 160, yuzeyY, sivi: GOL }))
  c.ekle(silindir(c, { cx, ustY, boy, r, renk: '#d93d2b', ad: 'sam', serit: { renk: '#f4f4f4', aralik: 20 } }))
  // suyun altında kalan kısım: yalnız şamandıranın silüeti üzerinde yarı saydam su
  c.ekle(
    `<path d="M ${s(cx - r)} ${s(yuzeyY)} L ${s(cx - r)} ${s(ustY + boy)} A ${s(r)} ${s(ry)} 0 0 0 ${s(cx + r)} ${s(ustY + boy)} L ${s(cx + r)} ${s(yuzeyY)} Z" fill="#2f6f9e" fill-opacity="0.42"/>`,
    `<line x1="10" y1="${yuzeyY}" x2="590" y2="${yuzeyY}" stroke="#ffffff" stroke-width="1.4"/>`,
    `<rect x="${s(cx - 7)}" y="${s(ustY + boy + ry - 1)}" width="14" height="7" rx="2" fill="#26313b"/>`,
    yazi(cx + 14, ustY + boy + ry + 22, 'basınç sensörü', { boy: 12, renk: '#ffffff', hale: false }),
    olcuDikey(cx - r - 18, yuzeyY, yuzeyY + batma + ry, '60 cm', 'sol'),
  )
  // kıyıdan uzanan ahşap iskele (sağda kıyı) ve üstünde takılmayı bekleyen lamba
  const kiyi = c.dikey('kiyi', '#8a7a5c', '#5f533e')
  c.ekle(`<path d="M 540 ${yuzeyY - 30} Q 566 ${yuzeyY - 34} 590 ${yuzeyY - 38} L 590 ${yuzeyY + 160} L 552 ${yuzeyY + 160} Q 548 ${yuzeyY + 40} 540 ${yuzeyY} Z" fill="${kiyi}"/>`)
  const deckY = yuzeyY - 30
  const kazik = c.yatay('kazik', '#6e5236', 0.3)
  for (const x of [372, 432, 492]) c.ekle(`<rect x="${x}" y="${deckY + 6}" width="9" height="${yuzeyY + 150 - deckY}" fill="${kazik}"/>`)
  c.ekle(kutu({ x: 360, y: deckY, gen: 196, boy: 9, d: 24, renk: '#a77d52' }))
  for (let x = 380; x < 556; x += 22) c.ekle(`<line x1="${x}" y1="${deckY}" x2="${x + 17}" y2="${deckY - 11}" stroke="#7c5a39" stroke-width="0.8"/>`)
  // lamba: silindir gövde, sarı mercek kubbesi, eğik güneş paneli
  const lx = 452
  c.ekle(
    golge(c, lx + 4, deckY - 4, 24, 4),
    silindir(c, { cx: lx, ustY: deckY - 46, boy: 40, r: 15, renk: '#3d4650', ad: 'lamba-govde' }),
    `<ellipse cx="${lx}" cy="${deckY - 54}" rx="11" ry="12" fill="${c.radyal('mercek', '#fff6bf', '#e0a81c')}"/>`,
    `<rect x="${lx - 2}" y="${deckY - 72}" width="4" height="10" fill="#5c6670"/>`,
    `<polygon points="${lx - 22},${deckY - 74} ${lx + 18},${deckY - 82} ${lx + 26},${deckY - 72} ${lx - 14},${deckY - 64}" fill="#1f3b63" stroke="#0f2340" stroke-width="0.8"/>`,
    `<line x1="${lx - 8}" y1="${deckY - 72}" x2="${lx + 14}" y2="${deckY - 77}" stroke="#5d7fae" stroke-width="0.7"/>`,
    yazi(lx - 30, deckY - 92, 'takılacak lamba', { boy: 12, kalin: true, hiza: 'end' }),
    yazi(lx - 30, deckY - 76, 'kütle: 50 kg', { boy: 12, hiza: 'end' }),
  )
  return c.svg()
}

// ---------------------------------------------------------------------------
// S8: Model denizaltı ve safra tankı
// ---------------------------------------------------------------------------

export function s8(): string {
  const c = new Sekil('s8', 600, 320, 'Su dolu cam havuzda yüzen model denizaltı; safra tankı boş, gövdesinin küçük bir kısmı ve kulesi su yüzeyinin üstünde.')
  const x = 70
  const altY = 296
  const gen = 440
  const boy = 210
  const suYuk = 170
  const suY = altY - suYuk
  const gR = 34
  const gx = 160
  const gL = 240
  // V_b / V = 0,9 → gövde yüksekliğinin yaklaşık %86'sı su altında (kule hariç tutularak yaklaşık)
  const gy = suY + 2 * gR * 0.86 - gR
  const govde = c.dikey('denizalti', '#f9d84e', '#b8860b')
  const tank = gx + 100
  const denizalti =
    `<rect x="${s(gx)}" y="${s(gy - gR)}" width="${s(gL)}" height="${s(2 * gR)}" rx="${s(gR)}" fill="${govde}" stroke="#8a6a12" stroke-width="1"/>` +
    `<path d="M ${s(gx + 60)} ${s(gy - gR + 2)} L ${s(gx + 72)} ${s(gy - gR - 26)} L ${s(gx + 116)} ${s(gy - gR - 26)} L ${s(gx + 124)} ${s(gy - gR + 2)} Z" fill="${govde}" stroke="#8a6a12" stroke-width="1"/>` +
    `<line x1="${s(gx + 96)}" y1="${s(gy - gR - 26)}" x2="${s(gx + 96)}" y2="${s(gy - gR - 44)}" stroke="#5c6670" stroke-width="2.4"/>` +
    `<ellipse cx="${s(gx + gL + 8)}" cy="${s(gy)}" rx="4" ry="16" fill="#6b737b"/>` +
    [0, 1, 2].map((i) => `<circle cx="${s(gx + 28 + i * 22)}" cy="${s(gy + 4)}" r="6" fill="#2a4d6b" stroke="#e8edf2" stroke-width="1.6"/>`).join('') +
    // safra tankı kesiti: boş
    `<rect x="${s(tank)}" y="${s(gy - 10)}" width="96" height="36" rx="6" fill="#f3f6f8" stroke="#5c6670" stroke-width="1.4"/>` +
    `<path d="M ${s(tank + 48)} ${s(gy + 26)} L ${s(tank + 48)} ${s(gy + gR + 2)}" stroke="#5c6670" stroke-width="3"/>`
  c.ekle(camTank(c, { x, altY, gen, boy, d: 60, sivi: SU, siviYuksekligi: suYuk, ad: 'havuz', icerik: denizalti }))
  // tankın içi hava dolu: suyun rengini almasın
  c.ekle(`<rect x="${s(tank + 2)}" y="${s(gy - 8)}" width="92" height="32" rx="5" fill="#fbfcfd" fill-opacity="0.9"/>`)
  c.ekle(yazi(tank + 48, gy + 12, 'hava', { boy: 11, hiza: 'middle', renk: '#5b6878', hale: false }))
  c.ekle(`<line x1="${s(tank + 48)}" y1="${s(gy + 40)}" x2="${s(tank + 70)}" y2="${s(altY - 40)}" stroke="#2b3640" stroke-width="1"/>`)
  c.ekle(yazi(tank + 74, altY - 34, 'boş safra tankı (300 cm³)', { boy: 12 }))
  return c.svg()
}

// ---------------------------------------------------------------------------
// S9: Dalgıç, yüzeyde ve 10 m derinlikte
// ---------------------------------------------------------------------------

function dalgic(c: Sekil, x: number, y: number) {
  // yatay yüzen dalgıç; x,y gövde merkezinin solu (baş tarafı sağda)
  const neopren = c.dikey('neopren', '#3a4450', '#14191f')
  const tup = c.dikey('tup', '#f4d03f', '#b7950b')
  return (
    // tüp (sırtta)
    `<rect x="${s(x + 10)}" y="${s(y - 24)}" width="70" height="16" rx="8" fill="${tup}" stroke="#8d7408" stroke-width="0.8"/>` +
    // bacaklar ve paletler
    `<path d="M ${s(x + 8)} ${s(y - 6)} L ${s(x - 44)} ${s(y - 12)} L ${s(x - 46)} ${s(y - 2)} L ${s(x + 6)} ${s(y + 6)} Z" fill="${neopren}"/>` +
    `<path d="M ${s(x + 8)} ${s(y + 2)} L ${s(x - 40)} ${s(y + 10)} L ${s(x - 38)} ${s(y + 18)} L ${s(x + 10)} ${s(y + 12)} Z" fill="${neopren}"/>` +
    `<path d="M ${s(x - 44)} ${s(y - 12)} L ${s(x - 78)} ${s(y - 22)} L ${s(x - 74)} ${s(y - 2)} L ${s(x - 46)} ${s(y - 2)} Z" fill="#1d6fa5"/>` +
    `<path d="M ${s(x - 40)} ${s(y + 10)} L ${s(x - 72)} ${s(y + 12)} L ${s(x - 66)} ${s(y + 28)} L ${s(x - 38)} ${s(y + 18)} Z" fill="#1d6fa5"/>` +
    // gövde
    `<rect x="${s(x)}" y="${s(y - 12)}" width="92" height="26" rx="13" fill="${neopren}"/>` +
    // yelek (BCD)
    `<rect x="${s(x + 30)}" y="${s(y - 14)}" width="44" height="30" rx="8" fill="#2e86c1" fill-opacity="0.9"/>` +
    // kol
    `<path d="M ${s(x + 70)} ${s(y + 4)} L ${s(x + 108)} ${s(y + 16)} L ${s(x + 106)} ${s(y + 24)} L ${s(x + 66)} ${s(y + 14)} Z" fill="${neopren}"/>` +
    // baş ve maske
    `<circle cx="${s(x + 104)}" cy="${s(y - 2)}" r="13" fill="${neopren}"/>` +
    `<rect x="${s(x + 106)}" y="${s(y - 8)}" width="12" height="9" rx="3" fill="#9fd6f2" stroke="#1b2228" stroke-width="1.4"/>` +
    // kabarcıklar
    `<circle cx="${s(x + 112)}" cy="${s(y - 26)}" r="3" fill="none" stroke="#ffffff" stroke-width="1"/>` +
    `<circle cx="${s(x + 116)}" cy="${s(y - 38)}" r="2.2" fill="none" stroke="#ffffff" stroke-width="1"/>`
  )
}

export function s9(): string {
  const c = new Sekil('s9', 600, 404, 'Bir göl kesitinde aynı dalgıç yüzeye yakın ve 10 m derinlikte; derinlik cetveli solda.')
  const yuzeyY = 44
  const metre = 28
  c.ekle(suKesiti(c, { x: 10, y: 10, gen: 580, derinlik: 384, yuzeyY, sivi: GOL }))
  // derinlik cetveli
  let cetvel = `<line x1="58" y1="${yuzeyY}" x2="58" y2="${yuzeyY + 12 * metre}" stroke="#eaf4fb" stroke-width="1.4"/>`
  for (let m = 2; m <= 12; m += 2) {
    cetvel += `<line x1="52" y1="${yuzeyY + m * metre}" x2="64" y2="${yuzeyY + m * metre}" stroke="#eaf4fb" stroke-width="1.4"/>`
    cetvel += `<text x="46" y="${yuzeyY + m * metre + 4}" font-family="Arial, sans-serif" font-size="11" text-anchor="end" fill="#ffffff">${m} m</text>`
  }
  c.ekle(cetvel, yazi(46, yuzeyY - 8, 'su yüzeyi', { boy: 11, hiza: 'start' }))
  c.ekle(dalgic(c, 220, yuzeyY + 1.2 * metre))
  c.ekle(dalgic(c, 220, yuzeyY + 10 * metre))
  const etiket = (y: number, satir1: string, satir2: string) =>
    `<rect x="380" y="${y - 18}" width="190" height="40" rx="8" fill="#ffffff" fill-opacity="0.92"/>` +
    yazi(392, y - 2, satir1, { boy: 12, kalin: true }) +
    yazi(392, y + 14, satir2, { boy: 12 })
  c.ekle(etiket(yuzeyY + 1.2 * metre, 'Yüzeye yakın', 'Dalgıç ve donanım: 80 L'))
  c.ekle(etiket(yuzeyY + 10 * metre, '10 m derinlikte', 'Elbise sıkıştı: 76 L'))
  return c.svg()
}

// ---------------------------------------------------------------------------
// S10: Dünya'daki laboratuvar ve Ay üssü
// ---------------------------------------------------------------------------


function oyuncakTekne(c: Sekil, cx: number, suY: number, batma: number) {
  // 3B görünümlü tekne: güverte (üst yüzey), yan gövde, kabin
  const yuk = 30
  const ust = suY + batma - yuk
  const govde = c.dikey('oyuncak', '#e74c3c', '#922b21')
  const guverte = c.dikey('guverte', '#f5e6c8', '#d9c29a')
  const dx = 16
  const dy = -9
  return (
    `<polygon points="${s(cx - 50)},${s(ust)} ${s(cx - 50 + dx)},${s(ust + dy)} ${s(cx + 58 + dx)},${s(ust + dy)} ${s(cx + 74 + dx * 0.4)},${s(ust + dy * 0.5)} ${s(cx + 58)},${s(ust)}" fill="${guverte}" stroke="#a88a5a" stroke-width="0.8"/>` +
    `<path d="M ${s(cx - 50)} ${s(ust)} L ${s(cx + 58)} ${s(ust)} L ${s(cx + 74 + dx * 0.4)} ${s(ust + dy * 0.5)} L ${s(cx + 46)} ${s(ust + yuk)} L ${s(cx - 42)} ${s(ust + yuk)} Z" fill="${govde}" stroke="#7b241c" stroke-width="0.8"/>` +
    kutu({ x: cx - 18, y: ust - 18, gen: 34, boy: 16, d: 14, renk: '#eef2f5' }) +
    `<rect x="${s(cx - 12)}" y="${s(ust - 13)}" width="22" height="5" fill="#34495e"/>`
  )
}

function pencere(c: Sekil, cx: number, cy: number, ay: boolean) {
  const r = 26
  const id = `${c.onek}-pencere-${ay ? 'ay' : 'dunya'}`
  const ic = ay
    ? `<rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" fill="#0c1220"/>` +
      `<path d="M ${cx - r} ${cy + 8} Q ${cx} ${cy - 2} ${cx + r} ${cy + 10} L ${cx + r} ${cy + r} L ${cx - r} ${cy + r} Z" fill="${c.dikey('ay-yuzey', '#c9c9c9', '#7d7d7d')}"/>` +
      `<circle cx="${cx + 10}" cy="${cy - 12}" r="6" fill="${c.radyal('dunya', '#8fd3ff', '#1f5fae')}"/>`
    : `<rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" fill="${c.dikey('gok-p', '#8fc9ef', '#d8eefa')}"/>` +
      `<path d="M ${cx - r} ${cy + 12} Q ${cx} ${cy + 4} ${cx + r} ${cy + 14} L ${cx + r} ${cy + r} L ${cx - r} ${cy + r} Z" fill="#7dbb6a"/>`
  return (
    `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>` +
    `<circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="#9aa4ad"/>` +
    `<g clip-path="url(#${id})">${ic}</g>`
  )
}

export function s10(): string {
  const c = new Sekil('s10', 640, 300, 'Solda Dünya’daki laboratuvarda su dolu cam tankta yüzen oyuncak tekne; sağda Ay üssündeki aynı tank, tekne henüz konmamış. Pencerelerden dış ortam görünüyor.')
  const panel = (x0: number, baslik: string, g: string, tekne: boolean, zemin: string, ay: boolean) => {
    const x = x0 + 30
    const altY = 270
    const suYuk = 96
    const suY = altY - suYuk
    let p = `<rect x="${s(x0)}" y="20" width="300" height="270" rx="10" fill="${zemin}"/>`
    p += pencere(c, x0 + 256, 70, ay)
    p += camTank(c, {
      x,
      altY,
      gen: 200,
      boy: 130,
      d: 40,
      sivi: SU,
      siviYuksekligi: suYuk,
      ad: `t${x0}`,
      icerik: tekne ? oyuncakTekne(c, x + 92, suY, 12) : '',
    })
    if (!tekne) p += yazi(x + 110, suY - 26, '?', { boy: 30, kalin: true, hiza: 'middle', renk: '#5b6878' })
    p += yazi(x0 + 20, 48, baslik, { boy: 14, kalin: true })
    p += yazi(x0 + 20, 68, g, { boy: 13 })
    return p
  }
  c.ekle(panel(10, 'Dünya’daki laboratuvar', 'Yer çekimi ivmesi: g', true, '#eef3f7', false))
  c.ekle(panel(330, 'Ay üssündeki laboratuvar', 'Çekim ivmesi: g / 6', false, '#e7e9ee', true))
  return c.svg()
}

// ---------------------------------------------------------------------------
// S11: Buz küpleri ve kara buzulu
// ---------------------------------------------------------------------------

function bardak(c: Sekil, cx: number, altY: number, icerik: string, ad: string) {
  const ustR = 44
  const altR = 34
  const yuk = 120
  const ustY = altY - yuk
  const suY = altY - 78
  const su = c.dikey(`bardak-su-${ad}`, SU.ust, SU.alt, 0.45)
  const ryU = ustR * ELIPS
  const ryA = altR * ELIPS
  const suR = altR + ((ustR - altR) * 78) / yuk
  return (
    golge(c, cx + 4, altY + 2, altR * 1.3, 6) +
    `<ellipse cx="${s(cx)}" cy="${s(suY)}" rx="${s(suR - 1)}" ry="${s(suR * ELIPS)}" fill="${SU.yuzey}"/>` +
    icerik +
    `<path d="M ${s(cx - suR)} ${s(suY)} L ${s(cx + suR)} ${s(suY)} L ${s(cx + altR)} ${s(altY)} A ${s(altR)} ${s(ryA)} 0 0 1 ${s(cx - altR)} ${s(altY)} Z" fill="${su}"/>` +
    `<path d="M ${s(cx - ustR)} ${s(ustY)} L ${s(cx - altR)} ${s(altY)} A ${s(altR)} ${s(ryA)} 0 0 0 ${s(cx + altR)} ${s(altY)} L ${s(cx + ustR)} ${s(ustY)}" fill="none" stroke="#8ba3b4" stroke-width="1.6"/>` +
    `<ellipse cx="${s(cx)}" cy="${s(ustY)}" rx="${ustR}" ry="${s(ryU)}" fill="none" stroke="#8ba3b4" stroke-width="1.6"/>` +
    `<path d="M ${s(cx - ustR + 8)} ${s(ustY + 8)} L ${s(cx - altR + 6)} ${s(altY - 10)}" stroke="#ffffff" stroke-opacity="0.7" stroke-width="3" stroke-linecap="round"/>`
  )
}

function buzKupu(cx: number, ustY: number, ic = '') {
  const k = 30
  return (
    `<g opacity="0.92">` +
    kutu({ x: cx - k / 2, y: ustY, gen: k, boy: k, d: 12, renk: '#dff2fb' }) +
    `</g>` +
    ic +
    `<line x1="${s(cx - k / 2 + 4)}" y1="${s(ustY + 4)}" x2="${s(cx - k / 2 + 4)}" y2="${s(ustY + k - 6)}" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>`
  )
}

export function s11(): string {
  const c = new Sekil('s11', 660, 300, 'I: su dolu bardakta yüzen buz küpü. II: karadaki bir buzulun eriyen suyu denize akıyor. III: içinde küçük bir taş donmuş buz küpü su dolu bardakta yüzüyor.')
  const masaY = 268
  c.ekle(masa(c, 10, 650, masaY))
  // I
  const altY = masaY - 8
  const suY1 = altY - 78
  // Buzun yoğunluğu 0,9 g/cm³: küpün yaklaşık %90'ı su çizgisinin altında.
  c.ekle(bardak(c, 110, altY, buzKupu(110, suY1 - 3), 'b1'))
  c.ekle(panelBasligi(110, 40, 'I'))
  // II: kara buzulu
  const gx = 230
  const kara = c.dikey('kara', '#8d7b68', '#5d4f40')
  const buzul = c.dikey('buzul', '#ffffff', '#cfe6f3')
  c.ekle(
    `<rect x="${gx}" y="70" width="200" height="190" rx="10" fill="#eef6fb"/>` +
      `<rect x="${gx}" y="190" width="200" height="70" fill="${c.dikey('deniz-ii', DENIZ.ust, DENIZ.alt, 1)}"/>` +
      `<path d="M ${gx} 120 L ${gx + 110} 150 L ${gx + 130} 196 L ${gx} 196 Z" fill="${kara}"/>` +
      `<path d="M ${gx} 100 Q ${gx + 60} 104 ${gx + 112} 148 L ${gx + 70} 140 Q ${gx + 30} 128 ${gx} 128 Z" fill="${buzul}" stroke="#b9d3e2" stroke-width="1"/>` +
      `<path d="M ${gx + 104} 152 q 10 20 26 40" stroke="#5aa7d6" stroke-width="3" fill="none" stroke-linecap="round"/>` +
      `<line x1="${gx}" y1="190" x2="${gx + 200}" y2="190" stroke="#ffffff" stroke-width="1.4"/>` +
      yazi(gx + 40, 92, 'kara buzulu', { boy: 11 }) +
      yazi(gx + 150, 236, 'deniz', { boy: 12, renk: '#ffffff', hale: false, kalin: true }),
  )
  c.ekle(panelBasligi(gx + 100, 40, 'II'))
  // III
  // Taşlı buz daha derin yüzer: üst yüzü neredeyse su çizgisinde.
  const tas = `<path d="M 544 ${s(suY1 + 12)} l 7 -4 l 8 2 l 2 7 l -6 5 l -9 -1 Z" fill="#5d5650"/>`
  c.ekle(bardak(c, 550, altY, buzKupu(550, suY1 - 1, tas), 'b3'))
  c.ekle(panelBasligi(550, 40, 'III'))
  c.ekle(`<line x1="556" y1="${s(suY1 + 16)}" x2="604" y2="${s(suY1 - 30)}" stroke="#2b3640" stroke-width="1"/>`, yazi(606, suY1 - 34, 'taş', { boy: 12 }))
  return c.svg()
}

// ---------------------------------------------------------------------------
// S12: Dinamometre okuması - batma derinliği grafiği
// ---------------------------------------------------------------------------

export function s12(): string {
  const c = new Sekil('s12', 660, 330, 'Solda dinamometreye asılı silindir sıvıya yavaşça indiriliyor; sağda dinamometre okumasının silindirin alt yüzeyinin batma derinliğine göre grafiği, su ve X sıvısı için.')
  // sol: düzenek
  const masaY = 306
  const kap = { cx: 170, altY: masaY - 6, yukseklik: 110, r: 54, siviYuksekligi: 76 }
  const k = kapOlculeri(kap)
  const silBoy = 50
  const batma = 30 // 6 cm: 1 cm = 5 piksel (yalnızca bu düzenekte)
  const silUst = k.siviY + batma - silBoy
  const a = asiliDuzenek(c, { cubukX: 60, kolUcX: 170, masaY, kolY: 30, okuma: 4.8, maks: 10, okumaYazisi: '', dinamoBoy: 100 })
  const h = halka(164, silUst - 9)
  c.ekle(masa(c, 10, 300, masaY), a.duzenek)
  c.ekle(camKap(c, { ...kap, sivi: SU, ad: 'k', icerik: silindir(c, { cx: 164, ustY: silUst, boy: silBoy, r: 18, renk: '#c8ccd1', ad: 'sil' }) + h.svg }))
  c.ekle(ip(a.kancaX, a.kancaY, h.x, h.y), a.dinamo)
  c.ekle(olcuDikey(212, k.siviY, k.siviY + batma, 'h', 'sag'))
  // sağ: grafik
  const gx = 360
  const gy = 40
  const gw = 250
  const gh = 220
  const x = (h0: number) => gx + (h0 / 15) * gw
  const y = (n: number) => gy + gh - (n / 7) * gh
  let g = ''
  for (let n = 1; n <= 7; n++) g += `<line x1="${gx}" y1="${s(y(n))}" x2="${gx + gw}" y2="${s(y(n))}" stroke="#e3e8ed" stroke-width="1"/>`
  for (let hh = 5; hh <= 15; hh += 5) g += `<line x1="${s(x(hh))}" y1="${gy}" x2="${s(x(hh))}" y2="${gy + gh}" stroke="#e3e8ed" stroke-width="1"/>`
  g += `<line x1="${gx}" y1="${gy + gh}" x2="${gx + gw + 10}" y2="${gy + gh}" stroke="#2b3640" stroke-width="1.4"/>`
  g += `<line x1="${gx}" y1="${gy + gh}" x2="${gx}" y2="${gy - 10}" stroke="#2b3640" stroke-width="1.4"/>`
  for (let n = 0; n <= 7; n++) g += yazi(gx - 8, y(n) + 4, String(n), { boy: 11, hiza: 'end' })
  for (let hh = 0; hh <= 15; hh += 5) g += yazi(x(hh), gy + gh + 16, String(hh), { boy: 11, hiza: 'middle' })
  // eksen etiketleri: yatay eksenin sağ ucunda, dikey eksenin üstünde
  g += yazi(gx + gw + 14, gy + gh + 4, 'h (cm)', { boy: 12, kalin: true })
  g += yazi(gx + 6, gy - 16, 'Dinamometre okuması (N)', { boy: 12, kalin: true })
  const cizgi = (pts: [number, number][], renk: string) =>
    `<polyline points="${pts.map(([a0, b0]) => `${s(x(a0))},${s(y(b0))}`).join(' ')}" fill="none" stroke="${renk}" stroke-width="2.6" stroke-linejoin="round"/>`
  g += cizgi([[0, 6], [10, 4], [15, 4]], '#1f6fb2')
  g += cizgi([[0, 6], [10, 3.6], [15, 3.6]], '#c0392b')
  g += yazi(x(15) - 4, y(4) - 6, 'su', { boy: 12, kalin: true, hiza: 'end', renk: '#1f6fb2' })
  g += yazi(x(15) - 4, y(3.6) + 16, 'X sıvısı', { boy: 12, kalin: true, hiza: 'end', renk: '#c0392b' })
  c.ekle(g)
  return c.svg()
}

export const SEKILLER: Record<string, () => string> = { s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12 }

// Yardımcılar başka dosyalarda gerekmiyor; kullanılmayan içe aktarım uyarısı olmasın.
void TUZLU_SU
void buyukluk
void ok
