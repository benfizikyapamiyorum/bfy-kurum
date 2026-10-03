// Şekil animasyonu kancası (API).
//
// Soru şekli tek bir SVG'dir. Şekildeki öğeler data-ciz-* öznitelikleriyle işaretlenir:
//
//   data-ciz-adim="n"     Öğe hangi adımda görünür. 0: soru açılınca; k: k. çözüm adımı açılınca.
//                         İşaretsiz öğeler her zaman görünür.
//   data-ciz-tur="..."    ciz      : çizgi uçtan uca çizilir (path, line, polyline, polygon, circle, rect).
//                         belir    : saydamlıktan belirir (yazı, dolgu, grup için varsayılan).
//                         hareket  : öğe, data-ciz-yol ile verilen yol boyunca sabit süratle ilerler.
//                         kinematik: öğe, x = x0 + ϑt + ½at² ile hareket eder (fiziksel olarak doğru
//                                    serbest düşme ve atış). data-ciz-p0="x,y", data-ciz-v="vx,vy",
//                                    data-ciz-a="ax,ay" (SVG birimi/s, birim/s²), data-ciz-t (model süresi, s).
//                         Kayıtlı başka bir tür (animasyonTuruKaydet ile eklenen).
//   data-ciz-sure="ms"    Animasyon süresi (varsayılan 700 ms).
//   data-ciz-gecikme="ms" Başlamadan önce bekleme.
//
// Grup (<g>) işaretlenirse içindeki çizgiler birlikte çizilir, dolgular ve yazılar sonda belirir.
// Hareket türleri adımından önce de görünür (başlangıç konumunda bekler) ve adımı gelince hareket eder.
// Kullanıcı "azaltılmış hareket" tercih ediyorsa her şey animasyonsuz gösterilir.
//
// Kullanım:
//   const a = new SekilAnimatoru(svgOgesi)
//   a.adimaGit(0)        // soru ekranı açıldı
//   a.adimaGit(2)        // 2. çözüm adımı açıldı: 1 ve 2. adımın öğeleri çizilir
//   a.adimaGit(0)        // geri dönüldü: 1 ve 2. adımın öğeleri gizlenir
//   a.yenidenOynat()     // şu ana kadar açılmış her şeyi baştan çizer
//   a.durdur()

export interface AnimasyonBaglami {
  sure: number
  gecikme: number
  animasyonlu: boolean
}

/** Özel animasyon türü: öğeyi canlandırır, oluşturduğu Animation nesnelerini döndürür. */
export type AnimasyonTuru = (oge: SVGElement, b: AnimasyonBaglami) => Animation[]

const kayitliTurler = new Map<string, AnimasyonTuru>()

/** Yeni bir animasyon türü ekler (ör. 'isin-kirilma'). Şekilde data-ciz-tur="ad" ile kullanılır. */
export function animasyonTuruKaydet(ad: string, tur: AnimasyonTuru): void {
  kayitliTurler.set(ad, tur)
}

const CIZGI_OGELERI = new Set(['path', 'line', 'polyline', 'polygon', 'circle', 'ellipse', 'rect'])
const HAREKET_TURLERI = new Set(['hareket', 'kinematik'])

const hareketAzaltilmisMi = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

const sayi = (deger: string | null, varsayilan: number) => {
  const n = deger === null ? NaN : Number(deger)
  return Number.isFinite(n) ? n : varsayilan
}

const cift = (deger: string | null): [number, number] => {
  const [x = '0', y = '0'] = (deger ?? '0,0').split(',')
  return [sayi(x, 0), sayi(y, 0)]
}

/** Dolgusuz, çizgisi olan geometri öğesi mi (stroke-dashoffset ile çizilebilir mi)? */
function cizilebilirMi(oge: Element): oge is SVGGeometryElement {
  if (!CIZGI_OGELERI.has(oge.tagName.toLowerCase())) return false
  if (typeof (oge as SVGGeometryElement).getTotalLength !== 'function') return false
  const dolgu = oge.getAttribute('fill')
  const cizgi = oge.getAttribute('stroke')
  // Kesikli çizgi dasharray'i bozulmasın diye belirerek gelir.
  if (oge.hasAttribute('stroke-dasharray')) return false
  return !!cizgi && cizgi !== 'none' && (dolgu === 'none' || oge.tagName.toLowerCase() === 'line' || oge.tagName.toLowerCase() === 'polyline')
}

interface Parca {
  oge: SVGElement
  adim: number
  tur: string
}

export class SekilAnimatoru {
  private readonly parcalar: Parca[]
  private readonly animasyonlar = new Set<Animation>()
  private gosterilenAdim = -1
  readonly animasyonlu: boolean

  constructor(
    private readonly kok: SVGSVGElement,
    secenek: { animasyonlu?: boolean } = {},
  ) {
    this.animasyonlu =
      (secenek.animasyonlu ?? true) && !hareketAzaltilmisMi() && typeof Element.prototype.animate === 'function'
    this.parcalar = [...kok.querySelectorAll<SVGElement>('[data-ciz-adim]')].map((oge) => ({
      oge,
      adim: sayi(oge.getAttribute('data-ciz-adim'), 0),
      tur: oge.getAttribute('data-ciz-tur') ?? (cizilebilirMi(oge) ? 'ciz' : 'belir'),
    }))
    for (const p of this.parcalar) this.gizle(p)
  }

  /** Şekilde animasyonlu öğe var mı? */
  get bosMu(): boolean {
    return this.parcalar.length === 0
  }

  /** En büyük adım numarası. */
  get sonAdim(): number {
    return this.parcalar.reduce((m, p) => Math.max(m, p.adim), -1)
  }

  /** Verilen adıma kadar olan öğeleri gösterir, sonrakileri gizler. */
  adimaGit(adim: number, animasyonlu = this.animasyonlu): void {
    for (const p of this.parcalar) {
      const gorunur = p.adim <= adim
      const yeni = p.adim > this.gosterilenAdim
      if (gorunur && yeni) this.oynat(p, animasyonlu)
      else if (!gorunur) this.gizle(p)
    }
    this.gosterilenAdim = adim
  }

  /** Şu ana kadar açılmış adımları baştan çizer. */
  yenidenOynat(): void {
    const adim = this.gosterilenAdim
    this.gosterilenAdim = -1
    for (const p of this.parcalar) this.gizle(p)
    this.adimaGit(adim)
  }

  tumunuGoster(): void {
    this.adimaGit(Number.MAX_SAFE_INTEGER, false)
  }

  durdur(): void {
    for (const a of this.animasyonlar) a.finish()
    this.animasyonlar.clear()
  }

  // ------------------------------------------------------------------

  private izle(a: Animation): Animation {
    this.animasyonlar.add(a)
    a.finished.then(
      () => this.animasyonlar.delete(a),
      () => this.animasyonlar.delete(a),
    )
    return a
  }

  private iptal(oge: Element): void {
    for (const a of this.animasyonlar) {
      const hedef = (a.effect as KeyframeEffect | null)?.target
      if (hedef && (hedef === oge || oge.contains(hedef))) {
        a.cancel()
        this.animasyonlar.delete(a)
      }
    }
  }

  private gizle(p: Parca): void {
    this.iptal(p.oge)
    if (HAREKET_TURLERI.has(p.tur)) {
      // Hareketli öğe başlangıç konumunda görünür kalır.
      const bas = this.hareketNoktalari(p)[0]
      if (bas) p.oge.setAttribute('transform', `translate(${bas[0]} ${bas[1]})`)
      return
    }
    p.oge.style.opacity = '0'
  }

  private oynat(p: Parca, animasyonlu: boolean): void {
    const b: AnimasyonBaglami = {
      sure: sayi(p.oge.getAttribute('data-ciz-sure'), 700),
      gecikme: sayi(p.oge.getAttribute('data-ciz-gecikme'), 0),
      animasyonlu,
    }
    this.iptal(p.oge)

    if (HAREKET_TURLERI.has(p.tur)) {
      const noktalar = this.hareketNoktalari(p)
      const son = noktalar[noktalar.length - 1]
      if (son) p.oge.setAttribute('transform', `translate(${son[0]} ${son[1]})`)
      if (animasyonlu && noktalar.length > 1) {
        // SVG transform özniteliği yerine CSS transform anime edilir; bitince öznitelik son konumu tutar.
        p.oge.setAttribute('transform', '')
        const a = p.oge.animate(
          noktalar.map(([x, y]) => ({ transform: `translate(${x}px, ${y}px)` })),
          { duration: b.sure, delay: b.gecikme, easing: 'linear', fill: 'both' },
        )
        this.izle(a)
        a.finished.then(
          () => {
            if (son) p.oge.setAttribute('transform', `translate(${son[0]} ${son[1]})`)
            a.cancel()
          },
          () => {},
        )
      }
      return
    }

    p.oge.style.opacity = '1'
    if (!animasyonlu) return

    const ozel = kayitliTurler.get(p.tur)
    if (ozel) {
      ozel(p.oge, b).forEach((a) => this.izle(a))
      return
    }

    if (p.tur === 'ciz') {
      const cizilecek = cizilebilirMi(p.oge) ? [p.oge] : []
      this.ciz(cizilecek, [], b)
      return
    }

    // Grup ya da tek öğe: çizgiler çizilir, geri kalanı belirir.
    const ogeler = p.oge.tagName.toLowerCase() === 'g' ? [...p.oge.querySelectorAll<SVGElement>('*')] : []
    const cizgiler = ogeler.filter(cizilebilirMi)
    const digerleri = ogeler.filter(
      (o) => !cizilebilirMi(o) && !['tspan', 'stop'].includes(o.tagName.toLowerCase()) && !o.querySelector('*:not(tspan)'),
    )
    if (cizgiler.length === 0) {
      this.izle(
        p.oge.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: Math.min(b.sure, 500),
          delay: b.gecikme,
          easing: 'ease-out',
          fill: 'backwards',
        }),
      )
      return
    }
    this.ciz(cizgiler, digerleri, b)
  }

  /** Çizgileri uçtan uca çizer; ardından diğer öğeleri belirtir. */
  private ciz(cizgiler: SVGGeometryElement[], belirenler: SVGElement[], b: AnimasyonBaglami): void {
    for (const c of cizgiler) {
      const boy = c.getTotalLength()
      if (!Number.isFinite(boy) || boy <= 0) continue
      this.izle(
        c.animate(
          [
            { strokeDasharray: `${boy}`, strokeDashoffset: `${boy}` },
            { strokeDasharray: `${boy}`, strokeDashoffset: '0' },
          ],
          { duration: b.sure, delay: b.gecikme, easing: 'ease-in-out', fill: 'backwards' },
        ),
      )
    }
    for (const o of belirenler) {
      this.izle(
        o.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 200,
          delay: b.gecikme + b.sure * 0.85,
          fill: 'backwards',
        }),
      )
    }
  }

  /** Hareket türleri için örneklenmiş konumlar. */
  private hareketNoktalari(p: Parca): [number, number][] {
    const N = 60
    if (p.tur === 'kinematik') {
      const [x0, y0] = cift(p.oge.getAttribute('data-ciz-p0'))
      const [vx, vy] = cift(p.oge.getAttribute('data-ciz-v'))
      const [ax, ay] = cift(p.oge.getAttribute('data-ciz-a'))
      const T = sayi(p.oge.getAttribute('data-ciz-t'), 1)
      return Array.from({ length: N + 1 }, (_, i) => {
        const t = (T * i) / N
        return [x0 + vx * t + 0.5 * ax * t * t, y0 + vy * t + 0.5 * ay * t * t]
      })
    }
    const yolId = p.oge.getAttribute('data-ciz-yol')
    const yol = yolId ? this.kok.querySelector<SVGGeometryElement>(`#${CSS.escape(yolId)}`) : null
    if (!yol || typeof yol.getTotalLength !== 'function') return []
    const boy = yol.getTotalLength()
    return Array.from({ length: N + 1 }, (_, i) => {
      const n = yol.getPointAtLength((boy * i) / N)
      return [n.x, n.y]
    })
  }
}
