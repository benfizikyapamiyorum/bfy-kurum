// Fizik Atölye pilot paketini (canli-demo.html içindeki ders JSON'u) sistemin içe aktarım
// biçimine çevirir. Kaynak: icerik-paketleri/fizik-atolye/kaynak/
// Çıktı: icerik-paketleri/kaldirma-kuvveti.json  (Süper admin > Toplu içe aktarım ile yüklenir)
// Kullanım: npx tsx scripts/atolye-paketi-donustur.ts
//
// Sorular "yayinda: false" aktarılır: bağımsız fizik incelemesi bitince süper admin yayına alır.

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { iceAktarimDogrula, type IceAktarimDosyasi, type IceAktarimSorusu } from '../src/alan/iceAktarim'
import { katalog } from '../src/veri/katalog'

const kok = resolve(import.meta.dirname, '..')
const oku = (y: string) => JSON.parse(readFileSync(resolve(kok, y), 'utf8'))

interface Oge {
  t: 'line' | 'rect' | 'text' | 'poly' | 'ellipse'
  [k: string]: unknown
}
interface Panel {
  width: number
  height: number
  title?: string
  items: Oge[]
}
interface Sekil {
  alt: string
  panels: Panel[]
}

const paket = oku('icerik-paketleri/fizik-atolye/kaynak/kaldirma-kuvveti.json') as {
  title: string
  grade: number
  outcomes: { id: string; title: string }[]
  plans: Record<string, { time: string; title: string; body: string }[]>
  summary: { title: string; body: string; figure?: Sekil }[]
  questions: {
    id: string
    title: string
    level: string
    skill: string
    outcome: string
    stem: string
    table?: string[][]
    options: string[]
    answer: string
    explanation: string
    rubric?: string
    misconception?: string
    figure?: Sekil
  }[]
}
const dersler = oku('icerik-paketleri/fizik-atolye/kaynak/kaldirma-kuvveti-adimlar.json') as Record<
  string,
  { steps: { title: string; body: string; equation?: string; prompt?: string }[]; why: Record<string, string> }
>

// ---------------------------------------------------------------------------
// Hakem düzeltmeleri. Bağımsız hakem 12 sorunun anahtarını ve sayılarını doğruladı; aşağıdakiler
// ifade düzeltmeleridir. Şekil düzeyindeki açık bulgular (S5/S12 balon, S7 kurgu tekrarı)
// docs/ICE_AKTARIM.md içinde listelenir; o sorular düzeltilene kadar yayına alınmaz.
// ---------------------------------------------------------------------------

type Soru0 = (typeof paket.questions)[number]
const KISALTMA = (q: Soru0, alan: 'stem' | 'explanation', eski: string, yeni: string) => {
  if (!q[alan].includes(eski)) throw new Error(`${q.id} düzeltmesi uygulanamadı: ${eski}`)
  q[alan] = q[alan].replace(eski, yeni)
}
const DUZELTMELER: Record<string, (q: Soru0) => void> = {
  S3: (q) => {
    KISALTMA(q, 'explanation', " S2'deki yüzen cismin koşulları burada geçerli değildir.", ' Cisim ip ile tam batmış tutulduğundan batan hacim sabittir.')
    // Sayısal şıklar küçükten büyüğe.
    q.options = ['A) 0,80 F', 'B) F', 'C) 1,25 F', 'D) 1,50 F', 'E) 2,25 F']
    q.answer = 'C'
  },
  S4: (q) => {
    q.options[0] = "A) Y'ye etki eden kaldırma kuvveti X'e etki edenin iki katıdır."
    q.options[2] = "C) X'e etki eden kaldırma kuvveti Y'ye etki edenin iki katıdır."
  },
  S5: (q) => {
    KISALTMA(q, 'stem', '200 cm³ten 120 cm³e', "200 cm³'ten 120 cm³'e")
    KISALTMA(q, 'explanation', "Rijit küpte kullanılan 'hacim sabit' koşulu", 'Rijit cisimlerde geçerli olan “batan hacim sabit” koşulu')
    q.options = ['A) 0,40', 'B) 0,60', 'C) 1,00', 'D) 1,40', 'E) 1,67']
    q.answer = 'B'
  },
  S8: (q) => {
    // Deneme adları şık harfleriyle karışmasın: A-D yerine K-N.
    const ad: Record<string, string> = { A: 'K', B: 'L', C: 'M', D: 'N' }
    const cift = (t: string) => t.replace(/\b([A-D])\s?[-–]\s?([A-D])\b/g, (_, a: string, b: string) => `${ad[a]}–${ad[b]}`)
    q.table = q.table!.map((r, i) => (i === 0 ? r : [ad[r[0]!]!, ...r.slice(1)]))
    q.options = q.options.map((o) => o.slice(0, 3) + cift(o.slice(3)))
    q.explanation = cift(q.explanation)
    const d = dersler[q.id]!
    const harf = (t: string) => cift(t).replace(/\b([A-D]) ile ([A-D])(’|')/g, (_, a: string, b: string, k: string) => `${ad[a]} ile ${ad[b]}${k}`)
    d.steps = d.steps.map((a) => ({ ...a, body: harf(a.body), equation: a.equation && harf(a.equation), prompt: a.prompt && harf(a.prompt) }))
    d.why = Object.fromEntries(Object.entries(d.why).map(([h, t]) => [h, harf(t)]))
  },
  S9: (q) => {
    KISALTMA(
      q,
      'stem',
      "Bir öğrenci, 'Basınç artmışsa kaldırma kuvveti de mutlaka artmıştır' diyor. İki ölçümü birlikte kullanarak bu iddiayı değerlendiriniz. Cismin hacmi, kütlesi ve yer çekimi sabittir. Bu verilere göre hangi yorum doğrudur?",
      'Cismin hacmi, kütlesi ve yer çekimi sabittir. Bir öğrenci “Basınç artmışsa kaldırma kuvveti de mutlaka artmıştır.” diyor. İki ölçüme göre hangi yorum doğrudur?',
    )
    q.options[4] = 'E) Yerel basınç artarken kaldırma kuvveti sabit kalmıştır.'
  },
  S11: (q) => KISALTMA(q, 'explanation', '4 - 3', '4 − 3'),
  S12: (q) => KISALTMA(q, 'explanation', 'Rijit kutuda batan hacim sabit kaldığı için sonuç geçerlidir.', 'Rijit bir cisimde batan hacim sabit kaldığı için afişteki cümle geçerlidir.'),
}
for (const q of paket.questions) DUZELTMELER[q.id]?.(q)

// Hakemin şekil ya da kurgu düzeyinde değişiklik istediği sorular: düzeltilene kadar yayına alınmaz.
const ACIK_BULGU = new Set(['S5', 'S7', 'S12'])

// ---------------------------------------------------------------------------
// Şekil: panel ilkellerini (çizgi, dikdörtgen, yazı, çokgen, elips) gerçekçi renklerle SVG'ye çevirir.
// ---------------------------------------------------------------------------

const DOLGU: Record<string, string> = {
  water: 'url(#ak-su)',
  paper: '#ffffff',
  object: 'url(#ak-cisim)',
  submerged: 'url(#ak-cisim)',
  instrument: '#dfe6ec',
  ink: '#1d2733',
  top: '#c62828',
  bottom: '#1f5fae',
  side: '#6b7685',
  net: '#1b7a43',
  none: 'none',
}
const CIZGI: Record<string, string> = {
  glass: '#7f97ab',
  waterline: '#3d86c6',
  paper: '#ffffff',
  ink: '#1d2733',
  top: '#c62828',
  bottom: '#1f5fae',
  side: '#6b7685',
  net: '#1b7a43',
}

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const n = (v: unknown) => Math.round(Number(v) * 100) / 100

function oge(o: Oge): string {
  switch (o.t) {
    case 'line': {
      const renk = CIZGI[String(o.color ?? 'ink')] ?? '#1d2733'
      const kesik = o.dash ? ' stroke-dasharray="5 4"' : ''
      return `<line x1="${n(o.x1)}" y1="${n(o.y1)}" x2="${n(o.x2)}" y2="${n(o.y2)}" stroke="${renk}" stroke-width="${n(o.width ?? 1.5)}" stroke-linecap="round"${kesik}/>`
    }
    case 'rect': {
      const dolgu = DOLGU[String(o.fill ?? 'none')] ?? 'none'
      const kenar = o.fill === 'object' || o.fill === 'submerged' ? ' stroke="#8a4b0f" stroke-width="1.2"' : o.fill === 'instrument' ? ' stroke="#7f97ab" stroke-width="1"' : ''
      return `<rect x="${n(o.x)}" y="${n(o.y)}" width="${n(o.w)}" height="${n(o.h)}" rx="${n(o.radius ?? 0)}" fill="${dolgu}"${kenar}/>`
    }
    case 'ellipse': {
      const dolgu = DOLGU[String(o.fill ?? 'none')] ?? 'none'
      return `<ellipse cx="${n(o.x)}" cy="${n(o.y)}" rx="${n(o.rx)}" ry="${n(o.ry)}" fill="${dolgu}" stroke="#1d2733" stroke-width="1"/>`
    }
    case 'poly': {
      const pts = (o.points as number[][]).map(([x, y]) => `${n(x)},${n(y)}`).join(' ')
      const dolgu = DOLGU[String(o.fill ?? 'none')] ?? 'none'
      const renk = CIZGI[String(o.color ?? 'ink')] ?? '#1d2733'
      const kapali = dolgu !== 'none'
      return kapali
        ? `<polygon points="${pts}" fill="${dolgu}" stroke="${o.color ? renk : 'none'}" stroke-width="${n(o.width ?? 1)}"/>`
        : `<polyline points="${pts}" fill="none" stroke="${renk}" stroke-width="${n(o.width ?? 1.5)}" stroke-linejoin="round"/>`
    }
    case 'text': {
      const hiza = o.anchor === 'end' ? 'end' : o.anchor === 'middle' ? 'middle' : 'start'
      return `<text x="${n(o.x)}" y="${n(o.y)}" font-size="${n(o.size ?? 11)}" font-weight="${o.weight ?? 500}" text-anchor="${hiza}" fill="#1d2733" paint-order="stroke" stroke="#ffffff" stroke-width="3" stroke-linejoin="round">${xml(String(o.v))}</text>`
    }
  }
}

function sekilSvg(sekil: Sekil, onEk: string): string {
  const BOSLUK = 24
  const BASLIK = sekil.panels.some((p) => p.title) ? 20 : 0
  const genislik = sekil.panels.reduce((t, p) => t + p.width, 0) + BOSLUK * (sekil.panels.length - 1)
  const yukseklik = Math.max(...sekil.panels.map((p) => p.height)) + BASLIK
  let x = 0
  const paneller = sekil.panels
    .map((p) => {
      const g =
        `<g transform="translate(${x} ${BASLIK})">` +
        p.items.map(oge).join('') +
        `</g>` +
        (p.title
          ? `<text x="${x + p.width / 2}" y="14" font-size="12" font-weight="700" text-anchor="middle" fill="#1d2733">${xml(p.title)}</text>`
          : '')
      x += p.width + BOSLUK
      return g
    })
    .join('')
  // Gradyan kimlikleri soruya özgü: aynı sayfada birden çok şekil olsa da çakışmaz.
  const defs =
    `<defs>` +
    `<linearGradient id="ak-su" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4ecfa"/><stop offset="1" stop-color="#9ccbea"/></linearGradient>` +
    `<linearGradient id="ak-cisim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6c065"/><stop offset="1" stop-color="#d9861f"/></linearGradient>` +
    `</defs>`
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${genislik} ${yukseklik}" role="img" aria-label="${xml(sekil.alt)}">` +
    defs +
    paneller +
    `</svg>`
  return svg.replace(/ak-su/g, `${onEk}-su`).replace(/ak-cisim/g, `${onEk}-cisim`)
}

// ---------------------------------------------------------------------------

const tablo = (t: string[][]) =>
  `<table><thead><tr>${t[0]!.map((h) => `<th>${xml(h)}</th>`).join('')}</tr></thead><tbody>${t
    .slice(1)
    .map((r) => `<tr>${r.map((c) => `<td>${xml(c)}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`

const ZORLUK: Record<string, number> = { Başlangıç: 2, Uygulama: 3, Aktarım: 4 }
const nokta = (s: string) => (/[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`)

const sorular: IceAktarimSorusu[] = paket.questions.map((q) => {
  const ders = dersler[q.id]
  const secenekler = q.options.map((o, i) => {
    const harf = 'ABCDE'[i] as 'A' | 'B' | 'C' | 'D' | 'E'
    const metin = o.replace(/^[A-E]\)\s*/, '').trim()
    const gerekce = ders?.why[harf]
    return gerekce && harf !== q.answer ? { harf, metin, gerekce: nokta(gerekce) } : { harf, metin }
  })
  const adimlar = ders
    ? ders.steps.map(
        (a) =>
          `<strong>${xml(a.title)}.</strong> ${xml(a.body)}` +
          (a.equation ? `<br><span class="denklem">${xml(a.equation)}</span>` : '') +
          (a.prompt ? `<br><em>${xml(nokta(a.prompt))}</em>` : ''),
      )
    : [xml(q.explanation)]
  return {
    dis_kimlik: `fizik-atolye/kaldirma-kuvveti/${q.id}`,
    tur: 'coktan_secmeli',
    govde: xml(q.stem) + (q.table ? tablo(q.table) : ''),
    sekil_svg: q.figure ? sekilSvg(q.figure, `ak${q.id.toLowerCase()}`) : null,
    secenekler,
    dogru_cevap: q.answer,
    cozum_adimlari: adimlar,
    zorluk: ZORLUK[q.level] ?? 3,
    baglam_temelli: true,
    kazanimlar: [q.outcome],
    kaynak_notu: `Fizik Atölye pilotu, ${q.id}: ${nokta(q.title)}`,
    beceri: q.skill,
    kavram_yanilgisi: q.misconception ? nokta(q.misconception) : null,
    puanlama_olcutu: q.rubric ?? null,
    ornek: false,
    // Hakem anahtarları doğruladı; açık bulgusu kalan sorular kapalı kalır.
    yayinda: !ACIK_BULGU.has(q.id),
  }
})

const dosya: IceAktarimDosyasi = {
  surum: 1,
  kaynak: `Fizik Atölye pilotu: ${paket.title} (${paket.grade}. sınıf).`,
  katalog: {
    uniteler: [{ ders: 'FIZ', seviye: '9', no: 3, ad: 'Akışkanlar' }],
    kazanimlar: paket.outcomes.map((o, i) => ({ kod: o.id, metin: o.title, unite: { seviye: '9', no: 3 }, sira: 5 + i })),
  },
  sorular,
  icerikler: [
    {
      dis_kimlik: 'fizik-atolye/kaldirma-kuvveti/konu',
      tur: 'konu_anlatimi',
      baslik: 'Kaldırma kuvveti: kavram rehberi',
      aciklama: 'Şekilli kavram başlıkları ve 40 ya da 80 dakikalık ders akışı.',
      unite: { seviye: '9', no: 3 },
      sira: 1,
      kazanimlar: paket.outcomes.map((o) => o.id),
      veri: {
        bolumler: paket.summary.map((b, i) => ({
          baslik: b.title,
          metin: xml(b.body),
          sekil_svg: b.figure ? sekilSvg(b.figure, `akk${i + 1}`) : null,
        })),
        planlar: Object.fromEntries(Object.entries(paket.plans).map(([dk, adimlar]) => [dk, adimlar])),
      },
      ornek: false,
      yayinda: false,
    },
  ],
}

const sonuc = iceAktarimDogrula(dosya, new Set(katalog.kazanimlar.map((k) => k.kod)))
if (!sonuc.gecerli) {
  console.error(sonuc.hatalar.join('\n'))
  process.exit(1)
}
writeFileSync(resolve(kok, 'icerik-paketleri/kaldirma-kuvveti.json'), JSON.stringify(dosya, null, 2) + '\n')
console.log(`Hazır: ${sorular.length} soru, 1 konu anlatımı.`, sonuc.uyarilar.length ? `Uyarılar:\n${sonuc.uyarilar.join('\n')}` : '')
