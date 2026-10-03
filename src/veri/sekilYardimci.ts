// Örnek soru şekillerini üretmek için küçük SVG yardımcıları.
// Üretilen metin veritabanına soru.sekil_svg olarak yazılır; tahtada ve PDF'te aynen gösterilir.
// Animasyon öznitelikleri (data-ciz-*) docs/MIMARI.md içinde "Şekil animasyonu" bölümünde anlatılır.

export const RENK = {
  cizgi: '#1d2733',
  soluk: '#6b7685',
  izgara: '#d5dbe3',
  kirmizi: '#c62828',
  mavi: '#1f5fae',
  yesil: '#1b7a43',
  mor: '#6a3fb5',
  turuncu: '#d9611c',
} as const

const s = (n: number) => String(Math.round(n * 100) / 100)

/** Animasyon öznitelikleri. */
export interface Anim {
  adim?: number
  tur?: 'ciz' | 'belir' | 'hareket' | 'kinematik'
  sure?: number
  gecikme?: number
}

export const anim = (a?: Anim): string => {
  if (!a || a.adim === undefined) return ''
  let t = ` data-ciz-adim="${a.adim}"`
  if (a.tur) t += ` data-ciz-tur="${a.tur}"`
  if (a.sure) t += ` data-ciz-sure="${a.sure}"`
  if (a.gecikme) t += ` data-ciz-gecikme="${a.gecikme}"`
  return t
}

/** Ok: gövde çizgisi + dolu uç. Gövde önce çizilir, uç sonra belirir. */
export function ok(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  renk: string,
  a?: Anim,
  kalinlik = 3.5,
  uc = 13,
  kesikli = false,
): string {
  const dx = x2 - x1
  const dy = y2 - y1
  const boy = Math.hypot(dx, dy)
  const ux = dx / boy
  const uy = dy / boy
  const bx = x2 - ux * uc
  const by = y2 - uy * uc
  const px = -uy * uc * 0.45
  const py = ux * uc * 0.45
  const kesik = kesikli ? ' stroke-dasharray="7 5"' : ''
  return (
    `<g${anim(a)}>` +
    `<line x1="${s(x1)}" y1="${s(y1)}" x2="${s(bx + ux * 1)}" y2="${s(by + uy * 1)}" stroke="${renk}" stroke-width="${kalinlik}" stroke-linecap="round"${kesik}/>` +
    `<polygon points="${s(x2)},${s(y2)} ${s(bx + px)},${s(by + py)} ${s(bx - px)},${s(by - py)}" fill="${renk}"/>` +
    `</g>`
  )
}

/** Beyaz kenarlı (okunaklı) yazı. */
export function yazi(
  x: number,
  y: number,
  metin: string,
  ek: { renk?: string; boyut?: number; hiza?: 'start' | 'middle' | 'end'; kalin?: boolean; italik?: boolean } = {},
  a?: Anim,
): string {
  const { renk = RENK.cizgi, boyut = 16, hiza = 'middle', kalin = false, italik = false } = ek
  return (
    `<text x="${s(x)}" y="${s(y)}" font-size="${boyut}" text-anchor="${hiza}" fill="${renk}"` +
    `${kalin ? ' font-weight="700"' : ' font-weight="500"'}${italik ? ' font-style="italic"' : ''}` +
    ` paint-order="stroke" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"${anim(a)}>${metin}</text>`
  )
}

/** Alt indisli büyüklük adı: alt('ϑ', 'x') → ϑₓ. */
export const alt = (ana: string, indis: string) =>
  `${ana}<tspan font-size="0.72em" dy="4">${indis}</tspan><tspan dy="-4">\u200b</tspan>`

/** Vektör adı: harfin üstünde küçük ok. */
export function vektorAdi(x: number, y: number, harf: string, renk: string, a?: Anim): string {
  return (
    `<g${anim(a)}>` +
    yazi(x, y, harf, { renk, boyut: 18, kalin: true, italik: true }) +
    `<line x1="${s(x - 7)}" y1="${s(y - 19)}" x2="${s(x + 6)}" y2="${s(y - 19)}" stroke="${renk}" stroke-width="1.6"/>` +
    `<polygon points="${s(x + 9)},${s(y - 19)} ${s(x + 4)},${s(y - 22)} ${s(x + 4)},${s(y - 16)}" fill="${renk}"/>` +
    `</g>`
  )
}

/** Ölçü çizgisi: iki ucu oklu ince çizgi. */
export function olcu(x1: number, y1: number, x2: number, y2: number, renk: string = RENK.soluk): string {
  return (
    ok((x1 + x2) / 2, (y1 + y2) / 2, x1, y1, renk, undefined, 1.4, 8) +
    ok((x1 + x2) / 2, (y1 + y2) / 2, x2, y2, renk, undefined, 1.4, 8)
  )
}

export const svg = (genislik: number, yukseklik: number, icerik: string, etiket: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${genislik} ${yukseklik}" role="img" aria-label="${etiket}">` +
  icerik +
  `</svg>`

/** Grafik eksenleri: dikey eksen etiketi üstte, zaman ekseni etiketi yatay eksenin sağ ucunun yanında. */
export function eksenler(
  ox: number,
  oy: number,
  sagX: number,
  ustY: number,
  dikeyEtiket: string,
  yatayEtiket: string,
): string {
  return (
    ok(ox, oy, sagX, oy, RENK.cizgi, undefined, 2, 11) +
    ok(ox, oy, ox, ustY, RENK.cizgi, undefined, 2, 11) +
    yazi(ox + 10, ustY + 6, dikeyEtiket, { hiza: 'start', boyut: 15 }) +
    yazi(sagX + 6, oy + 5, yatayEtiket, { hiza: 'start', boyut: 15 }) +
    yazi(ox - 8, oy + 18, '0', { hiza: 'end', boyut: 14 })
  )
}

export const kesikCizgi = (x1: number, y1: number, x2: number, y2: number, renk: string = RENK.soluk, a?: Anim) =>
  `<line x1="${s(x1)}" y1="${s(y1)}" x2="${s(x2)}" y2="${s(y2)}" stroke="${renk}" stroke-width="1.4" stroke-dasharray="5 4"${anim(a)}/>`
