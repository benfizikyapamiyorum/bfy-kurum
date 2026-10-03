// Tahtada soru ya da kit üzerine kalemle çizim. Çizgiler vektör olarak tutulur; pencere boyutu
// değişince yeniden çizilir. Birden fazla parmak/kalem aynı anda çizebilir. Silgi de bir çizgidir
// (destination-out), böylece geri alma ve yeniden çizim tutarlı kalır.

import { useCallback, useEffect, useImperativeHandle, useRef, type Ref } from 'react'

export interface Cizgi {
  renk: string
  kalinlik: number
  silgi: boolean
  noktalar: [number, number][]
}

export interface CizimKatmaniKontrol {
  temizle: () => void
  geriAl: () => void
}

interface Ozellikler {
  etkin: boolean
  renk: string
  kalinlik: number
  silgi: boolean
  ref?: Ref<CizimKatmaniKontrol>
  onDegisti?: (cizgiSayisi: number) => void
}

function cizgiyiCiz(ctx: CanvasRenderingContext2D, c: Cizgi) {
  const n = c.noktalar
  if (n.length === 0) return
  ctx.save()
  ctx.globalCompositeOperation = c.silgi ? 'destination-out' : 'source-over'
  ctx.strokeStyle = c.renk
  ctx.fillStyle = c.renk
  ctx.lineWidth = c.kalinlik
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  if (n.length === 1) {
    ctx.beginPath()
    ctx.arc(n[0]![0], n[0]![1], c.kalinlik / 2, 0, Math.PI * 2)
    ctx.fill()
  } else {
    // Noktaların orta noktalarından geçen ikinci dereceden eğriler: yumuşak çizgi.
    ctx.beginPath()
    ctx.moveTo(n[0]![0], n[0]![1])
    for (let i = 1; i < n.length - 1; i++) {
      const [x, y] = n[i]!
      const [x2, y2] = n[i + 1]!
      ctx.quadraticCurveTo(x, y, (x + x2) / 2, (y + y2) / 2)
    }
    const son = n[n.length - 1]!
    ctx.lineTo(son[0], son[1])
    ctx.stroke()
  }
  ctx.restore()
}

export function CizimKatmani({ etkin, renk, kalinlik, silgi, ref, onDegisti }: Ozellikler) {
  const tuval = useRef<HTMLCanvasElement>(null)
  const cizgiler = useRef<Cizgi[]>([])
  const aktif = useRef(new Map<number, Cizgi>())

  const hepsiniCiz = useCallback(() => {
    const t = tuval.current
    const ctx = t?.getContext('2d')
    if (!t || !ctx) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, t.width, t.height)
    const oran = window.devicePixelRatio || 1
    ctx.setTransform(oran, 0, 0, oran, 0, 0)
    for (const c of cizgiler.current) cizgiyiCiz(ctx, c)
    for (const c of aktif.current.values()) cizgiyiCiz(ctx, c)
  }, [])

  // Boyutlandırma: tuval piksel yoğunluğuna göre keskin kalır.
  useEffect(() => {
    const t = tuval.current
    if (!t) return
    const gozlemci = new ResizeObserver(() => {
      const oran = window.devicePixelRatio || 1
      const { width, height } = t.getBoundingClientRect()
      t.width = Math.round(width * oran)
      t.height = Math.round(height * oran)
      hepsiniCiz()
    })
    gozlemci.observe(t)
    return () => gozlemci.disconnect()
  }, [hepsiniCiz])

  useImperativeHandle(
    ref,
    () => ({
      temizle: () => {
        cizgiler.current = []
        aktif.current.clear()
        hepsiniCiz()
        onDegisti?.(0)
      },
      geriAl: () => {
        cizgiler.current.pop()
        hepsiniCiz()
        onDegisti?.(cizgiler.current.length)
      },
    }),
    [hepsiniCiz, onDegisti],
  )

  const konum = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }

  const basla = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!etkin) return
    e.currentTarget.setPointerCapture(e.pointerId)
    // Kalemin arka tuşu ya da silgi ucu silgi gibi davranır.
    const silgiUcu = e.pointerType === 'pen' && (e.buttons & 32) !== 0
    aktif.current.set(e.pointerId, {
      renk,
      kalinlik: silgi || silgiUcu ? kalinlik * 6 : kalinlik,
      silgi: silgi || silgiUcu,
      noktalar: [konum(e)],
    })
    hepsiniCiz()
  }

  const ilerle = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = aktif.current.get(e.pointerId)
    if (!c) return
    const olaylar = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent]
    const r = e.currentTarget.getBoundingClientRect()
    for (const o of olaylar.length ? olaylar : [e.nativeEvent]) c.noktalar.push([o.clientX - r.left, o.clientY - r.top])
    hepsiniCiz()
  }

  const bitir = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = aktif.current.get(e.pointerId)
    if (!c) return
    aktif.current.delete(e.pointerId)
    cizgiler.current.push(c)
    hepsiniCiz()
    onDegisti?.(cizgiler.current.length)
  }

  return (
    <canvas
      ref={tuval}
      className={`cizim-katmani ${etkin ? 'etkin' : ''} ${silgi ? 'silgi' : ''}`}
      aria-hidden="true"
      onPointerDown={basla}
      onPointerMove={ilerle}
      onPointerUp={bitir}
      onPointerCancel={bitir}
    />
  )
}
