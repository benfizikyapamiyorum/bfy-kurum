// Kaldırma kuvveti paketinin şekilleri için 3B görünümlü SVG çizim takımı.
// Tek ışık yönü (sol üst), tek perspektif (eğik bakış, elips oranı ELIPS), gerçek oranlar.
// Her şekil kendi önekiyle gradyan üretir; aynı sayfada birden çok şekil çakışmaz.
// Çıktı DOMPurify SVG profilinden geçer: betik, filtre, foreignObject kullanılmaz.

export const ELIPS = 0.22 // silindir üst yüzeyi: ry = rx × ELIPS

const s = (n: number) => String(Math.round(n * 10) / 10)

// ---------------------------------------------------------------------------
// Renk yardımcıları
// ---------------------------------------------------------------------------

function hex(r: number, g: number, b: number) {
  const k = (x: number) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')
  return `#${k(r)}${k(g)}${k(b)}`
}
function cozHex(h: string): [number, number, number] {
  const x = h.replace('#', '')
  return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)]
}
/** t > 0 açar (beyaza), t < 0 koyulaştırır (siyaha). */
export function ton(h: string, t: number) {
  const [r, g, b] = cozHex(h)
  return t >= 0 ? hex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t) : hex(r * (1 + t), g * (1 + t), b * (1 + t))
}

// ---------------------------------------------------------------------------
// Şekil oluşturucu: gradyanları toplar, tek <svg> üretir.
// ---------------------------------------------------------------------------

export class Sekil {
  private defs = new Map<string, string>()
  private parcalar: string[] = []
  constructor(
    readonly onek: string,
    readonly genislik: number,
    readonly yukseklik: number,
    readonly aciklama: string,
  ) {}

  ekle(...p: string[]) {
    this.parcalar.push(...p)
    return this
  }

  /** Yatay malzeme gradyanı (silindir, çubuk): kenarlar koyu, ışık sol üçte birde. */
  yatay(ad: string, renk: string, parlak = 0.55) {
    const id = `${this.onek}-${ad}`
    if (!this.defs.has(id))
      this.defs.set(
        id,
        `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">` +
          `<stop offset="0" stop-color="${ton(renk, -0.35)}"/>` +
          `<stop offset="0.3" stop-color="${ton(renk, parlak)}"/>` +
          `<stop offset="0.55" stop-color="${renk}"/>` +
          `<stop offset="1" stop-color="${ton(renk, -0.45)}"/></linearGradient>`,
      )
    return `url(#${id})`
  }

  /** Dikey gradyan (sıvı gövdesi, gökyüzü, yüzeyler). */
  dikey(ad: string, ust: string, alt: string, opaklik = 1) {
    const id = `${this.onek}-${ad}`
    if (!this.defs.has(id))
      this.defs.set(
        id,
        `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
          `<stop offset="0" stop-color="${ust}" stop-opacity="${opaklik}"/>` +
          `<stop offset="1" stop-color="${alt}" stop-opacity="${opaklik}"/></linearGradient>`,
      )
    return `url(#${id})`
  }

  /** Küre ve yumuşak gölge için radyal gradyan. */
  radyal(ad: string, ic: string, dis: string, ofx = 0.35, ofy = 0.3, disOpak = 1) {
    const id = `${this.onek}-${ad}`
    if (!this.defs.has(id))
      this.defs.set(
        id,
        `<radialGradient id="${id}" cx="0.5" cy="0.5" r="0.5" fx="${ofx}" fy="${ofy}">` +
          `<stop offset="0" stop-color="${ic}"/><stop offset="1" stop-color="${dis}" stop-opacity="${disOpak}"/></radialGradient>`,
      )
    return `url(#${id})`
  }

  golgeDolgu() {
    return this.radyal('golge', 'rgba(20,30,40,0.38)', '#14202a', 0.5, 0.5, 0)
  }

  svg() {
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.genislik} ${this.yukseklik}" role="img" aria-label="${xml(this.aciklama)}">` +
      `<defs>${[...this.defs.values()].join('')}</defs>` +
      this.parcalar.join('') +
      `</svg>`
    )
  }
}

export const xml = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// ---------------------------------------------------------------------------
// Yazılar ve ölçü çizgileri
// ---------------------------------------------------------------------------

export function yazi(
  x: number,
  y: number,
  metin: string,
  o: { boy?: number; hiza?: 'start' | 'middle' | 'end'; kalin?: boolean; renk?: string; italik?: boolean; hale?: boolean } = {},
) {
  const hale = o.hale === false ? '' : ` paint-order="stroke" stroke="#ffffff" stroke-width="3.2" stroke-linejoin="round"`
  return (
    `<text x="${s(x)}" y="${s(y)}" font-family="'Segoe UI', Roboto, 'Noto Sans', Arial, sans-serif" font-size="${o.boy ?? 13}"` +
    ` font-weight="${o.kalin ? 700 : 500}" text-anchor="${o.hiza ?? 'start'}" fill="${o.renk ?? '#1b2530'}"` +
    `${o.italik ? ' font-style="italic"' : ''}${hale}>${xml(metin)}</text>`
  )
}

/** Alt indisli büyüklük, ör. F_k, V_b, d_s. */
export function buyukluk(x: number, y: number, ana: string, alt: string, o: { boy?: number; hiza?: 'start' | 'middle' | 'end'; renk?: string; ek?: string } = {}) {
  const boy = o.boy ?? 14
  return (
    `<text x="${s(x)}" y="${s(y)}" font-family="'Times New Roman', Georgia, serif" font-size="${boy}" font-style="italic" font-weight="600"` +
    ` text-anchor="${o.hiza ?? 'start'}" fill="${o.renk ?? '#1b2530'}" paint-order="stroke" stroke="#ffffff" stroke-width="3.2" stroke-linejoin="round">` +
    `${xml(ana)}<tspan font-size="${Math.round(boy * 0.68)}" dy="${s(boy * 0.28)}">${xml(alt)}</tspan>` +
    (o.ek ? `<tspan font-style="normal" font-family="'Segoe UI', Roboto, Arial, sans-serif" font-weight="500" dy="${s(-boy * 0.28)}">${xml(o.ek)}</tspan>` : '') +
    `</text>`
  )
}

/** Dikey ölçü çizgisi: uçlarda kısa çizgiler, ortada etiket. */
export function olcuDikey(x: number, y1: number, y2: number, metin: string, yon: 'sol' | 'sag' = 'sol') {
  const ek = yon === 'sol' ? -6 : 6
  return (
    `<g stroke="#4a5866" stroke-width="1.1" fill="none">` +
    `<line x1="${s(x)}" y1="${s(y1)}" x2="${s(x)}" y2="${s(y2)}"/>` +
    `<line x1="${s(x - 4)}" y1="${s(y1)}" x2="${s(x + 4)}" y2="${s(y1)}"/><line x1="${s(x - 4)}" y1="${s(y2)}" x2="${s(x + 4)}" y2="${s(y2)}"/>` +
    `</g>` +
    yazi(x + ek, (y1 + y2) / 2 + 4, metin, { boy: 12, hiza: yon === 'sol' ? 'end' : 'start' })
  )
}

/** Kuvvet oku: kalın gövde, dolu uç. */
export function ok(x1: number, y1: number, x2: number, y2: number, renk: string, kalin = 3.2) {
  const a = Math.atan2(y2 - y1, x2 - x1)
  const u = 10 + kalin
  const gx = x2 - Math.cos(a) * u * 0.8
  const gy = y2 - Math.sin(a) * u * 0.8
  const p1 = [x2 - Math.cos(a) * u + Math.sin(a) * u * 0.45, y2 - Math.sin(a) * u - Math.cos(a) * u * 0.45]
  const p2 = [x2 - Math.cos(a) * u - Math.sin(a) * u * 0.45, y2 - Math.sin(a) * u + Math.cos(a) * u * 0.45]
  return (
    `<line x1="${s(x1)}" y1="${s(y1)}" x2="${s(gx)}" y2="${s(gy)}" stroke="${renk}" stroke-width="${kalin}" stroke-linecap="round"/>` +
    `<polygon points="${s(x2)},${s(y2)} ${s(p1[0]!)},${s(p1[1]!)} ${s(p2[0]!)},${s(p2[1]!)}" fill="${renk}"/>`
  )
}

/** Panel başlığı (I, II ...). */
export function panelBasligi(x: number, y: number, metin: string) {
  return yazi(x, y, metin, { boy: 14, hiza: 'middle', kalin: true })
}

// ---------------------------------------------------------------------------
// Laboratuvar: masa, ayaklı düzenek, dinamometre, ip
// ---------------------------------------------------------------------------

/** Laboratuvar tezgâhı: üst yüzey ve ön kenar. */
export function masa(c: Sekil, x1: number, x2: number, y: number, derinlik = 26) {
  const ust = c.dikey('masa-ust', '#e9e2d6', '#d8cdbb')
  const on = c.dikey('masa-on', '#b9a68a', '#8f7b5f')
  return (
    `<polygon points="${s(x1 + 14)},${s(y - derinlik)} ${s(x2 - 14)},${s(y - derinlik)} ${s(x2)},${s(y)} ${s(x1)},${s(y)}" fill="${ust}"/>` +
    `<rect x="${s(x1)}" y="${s(y)}" width="${s(x2 - x1)}" height="12" fill="${on}"/>` +
    `<line x1="${s(x1)}" y1="${s(y)}" x2="${s(x2)}" y2="${s(y)}" stroke="#f6f1e8" stroke-width="1"/>`
  )
}

/** Cisim altına düşen yumuşak gölge. */
export function golge(c: Sekil, cx: number, y: number, rx: number, ry = rx * 0.22) {
  return `<ellipse cx="${s(cx)}" cy="${s(y)}" rx="${s(rx)}" ry="${s(ry)}" fill="${c.golgeDolgu()}"/>`
}

/**
 * Ayaklı düzenek: ağır taban, krom çubuk, bağlama parçası ve yatay kol.
 * Kolun ucundaki asma noktasını döndürür (dinamometrenin halkası buraya takılır).
 */
export function ayakliDuzenek(c: Sekil, o: { cubukX: number; masaY: number; ustY: number; kolUcX: number }) {
  const { cubukX, masaY, ustY, kolUcX } = o
  const taban = c.yatay('taban', '#3d4651', 0.25)
  const krom = c.yatay('krom', '#aeb7c0', 0.75)
  const parca = c.yatay('baglama', '#2f3a46', 0.3)
  const tabanG = 120
  const svg =
    golge(c, cubukX + 8, masaY - 4, 78, 9) +
    // taban: kutu görünümü
    `<polygon points="${s(cubukX - tabanG / 2 + 10)},${s(masaY - 22)} ${s(cubukX + tabanG / 2 + 10)},${s(masaY - 22)} ${s(cubukX + tabanG / 2)},${s(masaY - 12)} ${s(cubukX - tabanG / 2)},${s(masaY - 12)}" fill="#59636f"/>` +
    `<rect x="${s(cubukX - tabanG / 2)}" y="${s(masaY - 12)}" width="${tabanG}" height="10" rx="2" fill="${taban}"/>` +
    // çubuk
    `<rect x="${s(cubukX - 4)}" y="${s(ustY)}" width="8" height="${s(masaY - 17 - ustY)}" rx="3" fill="${krom}"/>` +
    // kol
    `<rect x="${s(cubukX)}" y="${s(ustY + 14)}" width="${s(kolUcX - cubukX + 6)}" height="6" rx="3" fill="${krom}"/>` +
    // bağlama parçası
    `<rect x="${s(cubukX - 9)}" y="${s(ustY + 8)}" width="18" height="18" rx="3" fill="${parca}"/>` +
    `<circle cx="${s(cubukX + 12)}" cy="${s(ustY + 17)}" r="4.5" fill="${ton('#2f3a46', 0.2)}" stroke="#1d252e" stroke-width="1"/>`
  return { svg, asmaX: kolUcX, asmaY: ustY + 20 }
}

/**
 * Yaylı dinamometre (newtonmetre): üstte halka, şeffaf pencereli metal gövde, ölçek, ibre, altta kanca.
 * (x, ustY) halkanın en üst noktası. Kancanın ucu döner; ip buradan başlar.
 */
export function dinamometre(
  c: Sekil,
  o: { x: number; ustY: number; boy?: number; okuma: number; maks: number; okumaYazisi?: string; yaziYonu?: 'sol' | 'sag' },
) {
  const { x, ustY, okuma, maks } = o
  const boy = o.boy ?? 150
  const gen = 26
  const govdeUst = ustY + 16
  const govdeAlt = govdeUst + boy
  const pencereUst = govdeUst + 12
  const pencereAlt = govdeAlt - 12
  const govde = c.yatay('dinamo', '#c9ced4', 0.8)
  const pencere = c.dikey('dinamo-pencere', '#fbfcfd', '#eef2f5')
  const oran = Math.max(0, Math.min(1, okuma / maks))
  const ibreY = pencereUst + 4 + (pencereAlt - pencereUst - 8) * oran
  let olcek = ''
  for (let i = 0; i <= maks * 2; i++) {
    const yy = pencereUst + 4 + ((pencereAlt - pencereUst - 8) * i) / (maks * 2)
    const buyuk = i % 2 === 0
    olcek += `<line x1="${s(x + 2)}" y1="${s(yy)}" x2="${s(x + (buyuk ? 9 : 6))}" y2="${s(yy)}" stroke="#2a333d" stroke-width="${buyuk ? 1.1 : 0.7}"/>`
  }
  for (const deger of [0, maks / 2, maks]) {
    const yy = pencereUst + 4 + (pencereAlt - pencereUst - 8) * (deger / maks)
    olcek += `<text x="${s(x - gen / 2 - 3)}" y="${s(yy + 3)}" font-family="Arial, sans-serif" font-size="8" font-weight="700" text-anchor="end" fill="#3a4550">${deger}</text>`
  }
  // yay: zikzak, ibreye kadar
  let yay = `M ${s(x - 5)} ${s(pencereUst + 2)}`
  const halka = 9
  for (let i = 1; i <= halka; i++) {
    const yy = pencereUst + 2 + ((ibreY - pencereUst - 2) * i) / halka
    yay += ` L ${s(i % 2 ? x - 1 : x - 9)} ${s(yy)}`
  }
  const kancaUcY = govdeAlt + 26
  const yon = o.yaziYonu ?? 'sag'
  const yaziX = yon === 'sag' ? x + gen / 2 + 10 : x - gen / 2 - 10
  const svg =
    // halka
    `<ellipse cx="${s(x)}" cy="${s(ustY + 7)}" rx="6" ry="7" fill="none" stroke="#8d969f" stroke-width="2.4"/>` +
    // gövde
    `<rect x="${s(x - gen / 2)}" y="${s(govdeUst)}" width="${gen}" height="${boy}" rx="6" fill="${govde}" stroke="#7d868f" stroke-width="0.8"/>` +
    `<rect x="${s(x - gen / 2 + 4)}" y="${s(pencereUst)}" width="${gen - 8}" height="${s(pencereAlt - pencereUst)}" rx="2" fill="${pencere}" stroke="#9aa3ab" stroke-width="0.6"/>` +
    `<path d="${yay}" fill="none" stroke="#6b737b" stroke-width="1.1" stroke-linejoin="round"/>` +
    olcek +
    // ibre
    `<rect x="${s(x - 10)}" y="${s(ibreY - 1.6)}" width="20" height="3.2" rx="1" fill="#d23a22"/>` +
    // alt çubuk ve kanca
    `<rect x="${s(x - 1.6)}" y="${s(govdeAlt)}" width="3.2" height="14" fill="#8d969f"/>` +
    `<path d="M ${s(x)} ${s(govdeAlt + 13)} q 0 9 -6 12 q -5 2 -6 -4" fill="none" stroke="#6f7881" stroke-width="2.4" stroke-linecap="round"/>` +
    // okuma etiketi: ibrenin hizasında, kısa bir çizgiyle
    (o.okumaYazisi
      ? `<line x1="${s(yon === 'sag' ? x + gen / 2 + 1 : x - gen / 2 - 1)}" y1="${s(ibreY)}" x2="${s(yon === 'sag' ? yaziX - 2 : yaziX + 2)}" y2="${s(ibreY)}" stroke="#d23a22" stroke-width="1"/>` +
        yazi(yaziX, ibreY + 4.5, o.okumaYazisi, { boy: 13, kalin: true, hiza: yon === 'sag' ? 'start' : 'end', renk: '#b02a14' })
      : '')
  // ip, kancanın en alt noktasından iner
  return { svg, kancaX: x - 6, kancaY: kancaUcY - 2 }
}

export function ip(x1: number, y1: number, x2: number, y2: number) {
  return `<line x1="${s(x1)}" y1="${s(y1)}" x2="${s(x2)}" y2="${s(y2)}" stroke="#3b3128" stroke-width="1.5" stroke-linecap="round"/>`
}

/** Cismin üstündeki küçük halka (ip bağlantısı). Halkanın tepe noktasını döndürür. */
export function halka(x: number, ustY: number) {
  return {
    svg: `<ellipse cx="${s(x)}" cy="${s(ustY + 4)}" rx="3.6" ry="4.2" fill="none" stroke="#5b636b" stroke-width="1.8"/>`,
    x,
    y: ustY,
  }
}

// ---------------------------------------------------------------------------
// Katı cisimler
// ---------------------------------------------------------------------------

/** Dik silindir. (cx, ustY) üst yüzeyin merkezi. */
export function silindir(c: Sekil, o: { cx: number; ustY: number; boy: number; r: number; renk: string; ad: string; serit?: { renk: string; aralik: number } }) {
  const { cx, ustY, boy, r, renk } = o
  const ry = r * ELIPS
  const yan = c.yatay(`sil-${o.ad}`, renk)
  let seritler = ''
  if (o.serit) {
    const sr = c.yatay(`sil-${o.ad}-serit`, o.serit.renk)
    for (let y = ustY + o.serit.aralik; y < ustY + boy - 2; y += o.serit.aralik * 2) {
      const h = Math.min(o.serit.aralik, ustY + boy - y)
      seritler += `<path d="M ${s(cx - r)} ${s(y)} A ${s(r)} ${s(ry)} 0 0 0 ${s(cx + r)} ${s(y)} L ${s(cx + r)} ${s(y + h)} A ${s(r)} ${s(ry)} 0 0 1 ${s(cx - r)} ${s(y + h)} Z" fill="${sr}"/>`
    }
  }
  return (
    `<path d="M ${s(cx - r)} ${s(ustY)} L ${s(cx - r)} ${s(ustY + boy)} A ${s(r)} ${s(ry)} 0 0 0 ${s(cx + r)} ${s(ustY + boy)} L ${s(cx + r)} ${s(ustY)} Z" fill="${yan}"/>` +
    seritler +
    `<ellipse cx="${s(cx)}" cy="${s(ustY)}" rx="${s(r)}" ry="${s(ry)}" fill="${ton(renk, 0.32)}" stroke="${ton(renk, -0.25)}" stroke-width="0.8"/>`
  )
}

/** Dikdörtgenler prizması (eğik bakış). (x, y) ön yüzün sol üst köşesi; d derinlik (görünen kayma). */
export function kutu(o: { x: number; y: number; gen: number; boy: number; d?: number; renk: string; cizgi?: boolean }) {
  const { x, y, gen, boy, renk } = o
  const d = o.d ?? gen * 0.35
  const dx = d * 0.7
  const dy = -d * 0.45
  const kenar = o.cizgi === false ? '' : ` stroke="${ton(renk, -0.45)}" stroke-width="0.8" stroke-linejoin="round"`
  return (
    `<polygon points="${s(x)},${s(y)} ${s(x + dx)},${s(y + dy)} ${s(x + gen + dx)},${s(y + dy)} ${s(x + gen)},${s(y)}" fill="${ton(renk, 0.35)}"${kenar}/>` +
    `<polygon points="${s(x + gen)},${s(y)} ${s(x + gen + dx)},${s(y + dy)} ${s(x + gen + dx)},${s(y + boy + dy)} ${s(x + gen)},${s(y + boy)}" fill="${ton(renk, -0.3)}"${kenar}/>` +
    `<rect x="${s(x)}" y="${s(y)}" width="${s(gen)}" height="${s(boy)}" fill="${renk}"${kenar}/>`
  )
}

export function kure(c: Sekil, o: { cx: number; cy: number; r: number; renk: string; ad: string }) {
  const dolgu = c.radyal(`kure-${o.ad}`, ton(o.renk, 0.6), ton(o.renk, -0.4))
  return `<circle cx="${s(o.cx)}" cy="${s(o.cy)}" r="${s(o.r)}" fill="${dolgu}"/>`
}

// ---------------------------------------------------------------------------
// Kaplar ve sıvılar
// ---------------------------------------------------------------------------

export interface Sivi {
  ad: string
  ust: string
  alt: string
  yuzey: string
  opaklik?: number
}

export const SU: Sivi = { ad: 'su', ust: '#b7def4', alt: '#4f9fd6', yuzey: '#d8eefa', opaklik: 0.34 }
export const TUZLU_SU: Sivi = { ad: 'tuzlu', ust: '#cdeee9', alt: '#4fa89d', yuzey: '#def4f0', opaklik: 0.48 }
export const PEKMEZ: Sivi = { ad: 'pekmez', ust: '#c7792e', alt: '#6e3410', yuzey: '#d9944c', opaklik: 0.86 }
export const ZEYTINYAGI: Sivi = { ad: 'yag', ust: '#e8d77a', alt: '#b59a28', yuzey: '#f1e6a6', opaklik: 0.72 }

/**
 * Silindirik cam kap. Çizim sırası: gölge, arka cam, sıvı yüzeyi, İÇERİK (kapta duran cisimler),
 * sıvı gövdesi (yarı saydam; batan kısımları renklendirir), ön cam ve parlamalar.
 * altY kabın taban çizgisinin ön noktası (masa düzlemi).
 */
export function camKap(
  c: Sekil,
  o: {
    cx: number
    altY: number
    yukseklik: number
    r: number
    sivi?: Sivi
    siviYuksekligi?: number
    icerik?: string
    oncesi?: string
    olcekli?: boolean
    ad: string
  },
) {
  const { cx, altY, yukseklik, r } = o
  const ry = r * ELIPS
  const ustY = altY - ry - yukseklik
  const tabanY = altY - ry
  const cam = c.yatay(`cam-${o.ad}`, '#dfeaf1', 0.9)
  let sivi = ''
  let yuzey = ''
  if (o.sivi && o.siviYuksekligi) {
    const sv = o.sivi
    const yy = tabanY - o.siviYuksekligi
    const dolgu = c.dikey(`sivi-${sv.ad}`, sv.ust, sv.alt, sv.opaklik ?? 0.62)
    // Yüzey elipsi ve ön kavsi cisimlerden ÖNCE çizilir: cisim önündeyse kavis cismin arkasında kalır,
    // cismin üzerinde ikinci bir su çizgisi görünmez.
    yuzey =
      `<ellipse cx="${s(cx)}" cy="${s(yy)}" rx="${s(r - 2)}" ry="${s(ry - 0.6)}" fill="${sv.yuzey}" fill-opacity="0.92" stroke="${ton(sv.alt, 0.1)}" stroke-width="0.8"/>` +
      `<path d="M ${s(cx - r + 2)} ${s(yy)} A ${s(r - 2)} ${s(ry - 0.6)} 0 0 0 ${s(cx + r - 2)} ${s(yy)}" fill="none" stroke="#ffffff" stroke-opacity="0.7" stroke-width="1.2"/>`
    sivi =
      // Sıvı gövdesi yüzeyin orta çizgisinden başlar: kabın ortasındaki cismin su çizgisi doğru yerde görünür.
      `<path d="M ${s(cx - r + 2)} ${s(yy)} L ${s(cx + r - 2)} ${s(yy)} L ${s(cx + r - 2)} ${s(tabanY)} A ${s(r - 2)} ${s(ry - 0.6)} 0 0 1 ${s(cx - r + 2)} ${s(tabanY)} Z" fill="${dolgu}"/>`
  }
  let olcek = ''
  if (o.olcekli) {
    for (let i = 1; i < 10; i++) {
      const yy = tabanY - (yukseklik * i) / 10
      olcek += `<line x1="${s(cx + r * 0.42)}" y1="${s(yy)}" x2="${s(cx + r * 0.42 + (i % 5 ? 6 : 11))}" y2="${s(yy)}" stroke="#5f7383" stroke-opacity="0.75" stroke-width="0.9"/>`
    }
  }
  return (
    golge(c, cx + 6, altY - 1, r * 1.15, r * 0.24) +
    // arka cam: iç yüzey
    `<path d="M ${s(cx - r)} ${s(ustY)} A ${s(r)} ${s(ry)} 0 0 1 ${s(cx + r)} ${s(ustY)} L ${s(cx + r)} ${s(tabanY)} A ${s(r)} ${s(ry)} 0 0 1 ${s(cx - r)} ${s(tabanY)} Z" fill="#eef4f8" fill-opacity="0.55"/>` +
    // kalın cam taban
    `<ellipse cx="${s(cx)}" cy="${s(tabanY)}" rx="${s(r)}" ry="${s(ry)}" fill="#d5e1e9" fill-opacity="0.8"/>` +
    (o.oncesi ?? '') +
    yuzey +
    (o.icerik ?? '') +
    sivi +
    // ön cam: yan kenarlar, ağız, taban kavsi
    `<path d="M ${s(cx - r)} ${s(ustY)} L ${s(cx - r)} ${s(tabanY)} A ${s(r)} ${s(ry)} 0 0 0 ${s(cx + r)} ${s(tabanY)} L ${s(cx + r)} ${s(ustY)}" fill="none" stroke="#8ba3b4" stroke-width="1.6"/>` +
    `<ellipse cx="${s(cx)}" cy="${s(ustY)}" rx="${s(r)}" ry="${s(ry)}" fill="none" stroke="#8ba3b4" stroke-width="1.6"/>` +
    `<path d="M ${s(cx - r)} ${s(ustY)} L ${s(cx - r)} ${s(tabanY)} A ${s(r)} ${s(ry)} 0 0 0 ${s(cx + r)} ${s(tabanY)} L ${s(cx + r)} ${s(ustY)} A ${s(r)} ${s(ry)} 0 0 1 ${s(cx - r)} ${s(ustY)} Z" fill="${cam}" fill-opacity="0.18"/>` +
    // parlamalar
    `<rect x="${s(cx - r * 0.72)}" y="${s(ustY + 10)}" width="${s(r * 0.09)}" height="${s(yukseklik - 22)}" rx="${s(r * 0.045)}" fill="#ffffff" fill-opacity="0.55"/>` +
    `<rect x="${s(cx + r * 0.62)}" y="${s(ustY + 16)}" width="${s(r * 0.05)}" height="${s(yukseklik * 0.55)}" rx="2" fill="#ffffff" fill-opacity="0.35"/>` +
    olcek
  )
}

/** Kabın ölçüleri: sıvı yüzeyi y'si gibi hesaplar için. */
export function kapOlculeri(o: { altY: number; yukseklik: number; r: number; siviYuksekligi?: number }) {
  const ry = o.r * ELIPS
  const tabanY = o.altY - ry
  return { ustY: tabanY - o.yukseklik, tabanY, siviY: tabanY - (o.siviYuksekligi ?? 0), ry }
}

/**
 * Dikdörtgen cam tank (akvaryum, havuz kesiti). (x, altY) ön alt sol köşe.
 * İçerik sıvıdan önce çizilir; sıvı batan kısımları renklendirir.
 */
export function camTank(
  c: Sekil,
  o: { x: number; altY: number; gen: number; boy: number; d: number; sivi: Sivi; siviYuksekligi: number; icerik?: string; ad: string; arka?: string },
) {
  const { x, altY, gen, boy, d, sivi } = o
  const dx = d * 0.7
  const dy = -d * 0.45
  const ustY = altY - boy
  const yy = altY - o.siviYuksekligi
  const govde = c.dikey(`tank-${sivi.ad}`, sivi.ust, sivi.alt, sivi.opaklik ?? 0.62)
  return (
    golge(c, x + gen / 2 + dx / 2, altY + 2, gen * 0.6, 10) +
    // arka ve yan iç yüzeyler
    `<polygon points="${s(x + dx)},${s(ustY + dy)} ${s(x + gen + dx)},${s(ustY + dy)} ${s(x + gen + dx)},${s(altY + dy)} ${s(x + dx)},${s(altY + dy)}" fill="#eef4f8" fill-opacity="0.7" stroke="#a9bccb" stroke-width="1"/>` +
    `<polygon points="${s(x)},${s(altY)} ${s(x + dx)},${s(altY + dy)} ${s(x + gen + dx)},${s(altY + dy)} ${s(x + gen)},${s(altY)}" fill="#cfdbe4"/>` +
    (o.arka ?? '') +
    // sıvı üst yüzeyi
    `<polygon points="${s(x)},${s(yy)} ${s(x + dx)},${s(yy + dy)} ${s(x + gen + dx)},${s(yy + dy)} ${s(x + gen)},${s(yy)}" fill="${sivi.yuzey}" fill-opacity="0.9" stroke="${ton(sivi.alt, 0.1)}" stroke-width="0.8"/>` +
    (o.icerik ?? '') +
    // sıvı ön ve yan gövdesi
    `<polygon points="${s(x + gen)},${s(yy)} ${s(x + gen + dx)},${s(yy + dy)} ${s(x + gen + dx)},${s(altY + dy)} ${s(x + gen)},${s(altY)}" fill="${govde}"/>` +
    `<rect x="${s(x)}" y="${s(yy)}" width="${s(gen)}" height="${s(altY - yy)}" fill="${govde}"/>` +
    `<line x1="${s(x)}" y1="${s(yy)}" x2="${s(x + gen)}" y2="${s(yy)}" stroke="#ffffff" stroke-opacity="0.75" stroke-width="1.3"/>` +
    // cam kenarlar
    `<polygon points="${s(x)},${s(ustY)} ${s(x + dx)},${s(ustY + dy)} ${s(x + gen + dx)},${s(ustY + dy)} ${s(x + gen)},${s(ustY)}" fill="none" stroke="#8ba3b4" stroke-width="1.4"/>` +
    `<rect x="${s(x)}" y="${s(ustY)}" width="${s(gen)}" height="${s(boy)}" fill="#dfeaf1" fill-opacity="0.12" stroke="#8ba3b4" stroke-width="1.6"/>` +
    `<polygon points="${s(x + gen)},${s(ustY)} ${s(x + gen + dx)},${s(ustY + dy)} ${s(x + gen + dx)},${s(altY + dy)} ${s(x + gen)},${s(altY)}" fill="#dfeaf1" fill-opacity="0.12" stroke="#8ba3b4" stroke-width="1.4"/>` +
    `<rect x="${s(x + 8)}" y="${s(ustY + 10)}" width="5" height="${s(boy - 24)}" rx="2.5" fill="#ffffff" fill-opacity="0.5"/>`
  )
}

/**
 * Formül etiketi: "F_k = G, d_c < d_s" gibi yazıyı alt indisli çizer. Tek harfli büyüklükler
 * (F, G, T, V, d, g, P, h) italik; alt indis _ ile, çok harfli alt indis _{alt} ile yazılır.
 */
export function formul(x: number, y: number, metin: string, o: { boy?: number; hiza?: 'start' | 'middle' | 'end'; renk?: string; kalin?: boolean } = {}) {
  const boy = o.boy ?? 14
  const parca = /([A-Za-z])_(\{[^}]+\}|[A-Za-zçğıöşü]+)|([FGTVdgPhm])(?![A-Za-zçğıöşü])/g
  let son = 0
  let ic = ''
  let m: RegExpExecArray | null
  const duz = (t: string) => (t ? `<tspan font-family="'Segoe UI', Roboto, Arial, sans-serif" font-style="normal">${xml(t)}</tspan>` : '')
  while ((m = parca.exec(metin))) {
    ic += duz(metin.slice(son, m.index))
    if (m[1]) {
      const alt = m[2]!.replace(/[{}]/g, '')
      ic += `<tspan font-style="italic">${xml(m[1])}</tspan><tspan font-size="${Math.round(boy * 0.68)}" dy="${s(boy * 0.28)}" font-style="normal">${xml(alt)}</tspan><tspan dy="${s(-boy * 0.28)}"></tspan>`
    } else {
      ic += `<tspan font-style="italic">${xml(m[3]!)}</tspan>`
    }
    son = m.index + m[0].length
  }
  ic += duz(metin.slice(son))
  return (
    `<text x="${s(x)}" y="${s(y)}" font-family="'Times New Roman', Georgia, serif" font-size="${boy}" font-weight="${o.kalin ? 700 : 600}"` +
    ` text-anchor="${o.hiza ?? 'start'}" fill="${o.renk ?? '#1b2530'}" paint-order="stroke" stroke="#ffffff" stroke-width="3.2" stroke-linejoin="round">${ic}</text>`
  )
}
